-- Migration: Invitations System for Multi-User Companies
-- Allows company owners to invite team members via email

-- Create invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'projectManager',
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  
  CONSTRAINT invitations_role_check CHECK (role IN ('owner', 'projectManager', 'estimator')),
  CONSTRAINT invitations_email_company_unique UNIQUE (email, company_id)
);

-- Create team_members view for easier querying
CREATE OR REPLACE VIEW public.team_members AS
SELECT 
  p.user_id,
  p.company_id,
  p.role,
  u.email,
  u.created_at as joined_at,
  c.name as company_name
FROM public.profiles p
JOIN auth.users u ON p.user_id = u.id
JOIN public.companies c ON p.company_id = c.id;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_company ON public.invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_company ON public.profiles(company_id);

-- RLS Policies for invitations

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Owners can view all invitations for their company
CREATE POLICY "invitations_select_company" ON public.invitations
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Owners can create invitations for their company
CREATE POLICY "invitations_insert_owner" ON public.invitations
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
    AND invited_by = auth.uid()
  );

-- Owners can update invitations (e.g., resend, cancel)
CREATE POLICY "invitations_update_owner" ON public.invitations
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Owners can delete invitations
CREATE POLICY "invitations_delete_owner" ON public.invitations
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Allow anyone to look up an invitation by token (for accepting)
-- This is handled via a function instead for security

-- Function to accept an invitation
CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv record;
  current_user_id uuid;
  current_user_email text;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Get user email
  SELECT email INTO current_user_email FROM auth.users WHERE id = current_user_id;
  
  -- Find the invitation
  SELECT * INTO inv FROM public.invitations 
  WHERE token = invitation_token 
    AND accepted_at IS NULL 
    AND expires_at > now();
  
  IF inv IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;
  
  -- Check email matches
  IF lower(inv.email) != lower(current_user_email) THEN
    RETURN json_build_object('success', false, 'error', 'This invitation was sent to a different email address');
  END IF;
  
  -- Check if user already has a profile
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = current_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'You are already a member of a company');
  END IF;
  
  -- Create the profile
  INSERT INTO public.profiles (user_id, company_id, role)
  VALUES (current_user_id, inv.company_id, inv.role);
  
  -- Mark invitation as accepted
  UPDATE public.invitations 
  SET accepted_at = now() 
  WHERE id = inv.id;
  
  RETURN json_build_object(
    'success', true, 
    'company_id', inv.company_id,
    'role', inv.role
  );
END;
$$;

-- Function to get invitation details by token (public, for signup page)
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(invitation_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv record;
  company_name text;
BEGIN
  SELECT i.*, c.name as company_name 
  INTO inv 
  FROM public.invitations i
  JOIN public.companies c ON i.company_id = c.id
  WHERE i.token = invitation_token 
    AND i.accepted_at IS NULL 
    AND i.expires_at > now();
  
  IF inv IS NULL THEN
    RETURN json_build_object('valid', false, 'error', 'Invalid or expired invitation');
  END IF;
  
  RETURN json_build_object(
    'valid', true,
    'email', inv.email,
    'role', inv.role,
    'company_name', inv.company_name,
    'expires_at', inv.expires_at
  );
END;
$$;

-- Function to get team members for a company
CREATE OR REPLACE FUNCTION public.get_team_members(target_company_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Check if user is part of this company
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND company_id = target_company_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized');
  END IF;
  
  SELECT json_agg(row_to_json(t))
  INTO result
  FROM (
    SELECT 
      p.user_id,
      p.role,
      u.email,
      u.created_at as joined_at
    FROM public.profiles p
    JOIN auth.users u ON p.user_id = u.id
    WHERE p.company_id = target_company_id
    ORDER BY u.created_at
  ) t;
  
  RETURN json_build_object('success', true, 'members', COALESCE(result, '[]'::json));
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.accept_invitation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_members(uuid) TO authenticated;

-- Comments
COMMENT ON TABLE public.invitations IS 'Stores pending team member invitations';
COMMENT ON FUNCTION public.accept_invitation IS 'Accepts an invitation and creates a profile for the user';
COMMENT ON FUNCTION public.get_invitation_by_token IS 'Gets invitation details for signup page';
COMMENT ON FUNCTION public.get_team_members IS 'Gets all team members for a company';

