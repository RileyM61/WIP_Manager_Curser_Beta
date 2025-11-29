-- Migration: Add CFO Managed Companies Support
-- This enables CFO practices to manage client companies

-- Add company classification and management fields to settings table
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS company_type TEXT DEFAULT 'direct',
ADD COLUMN IF NOT EXISTS managed_by_cfo_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS managed_by_cfo_company_id UUID,
ADD COLUMN IF NOT EXISTS managed_by_practice_name TEXT,
ADD COLUMN IF NOT EXISTS granted_modules JSONB DEFAULT '[]'::jsonb;

-- Create index for efficient lookup of managed companies by CFO
CREATE INDEX IF NOT EXISTS idx_settings_managed_by_cfo 
ON public.settings(managed_by_cfo_user_id) 
WHERE managed_by_cfo_user_id IS NOT NULL;

-- Create index for company type filtering
CREATE INDEX IF NOT EXISTS idx_settings_company_type 
ON public.settings(company_type);

-- Function to get all companies managed by a specific CFO user
CREATE OR REPLACE FUNCTION get_managed_companies(cfo_user_id UUID)
RETURNS TABLE (
  company_id UUID,
  company_name TEXT,
  company_type TEXT,
  granted_modules JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.company_id,
    s.company_name,
    s.company_type,
    s.granted_modules,
    c.created_at
  FROM public.settings s
  JOIN public.companies c ON c.id = s.company_id
  WHERE s.managed_by_cfo_user_id = cfo_user_id
  ORDER BY s.company_name;
END;
$$;

-- Function to create a managed company for a CFO's client
CREATE OR REPLACE FUNCTION create_managed_company(
  p_company_name TEXT,
  p_cfo_user_id UUID,
  p_cfo_company_id UUID,
  p_practice_name TEXT,
  p_granted_modules JSONB DEFAULT '["wip"]'::jsonb,
  p_owner_email TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company_id UUID;
BEGIN
  -- Create the company
  INSERT INTO public.companies (name, owner_user_id)
  VALUES (p_company_name, p_cfo_user_id)
  RETURNING id INTO v_company_id;
  
  -- Create settings with managed status
  INSERT INTO public.settings (
    company_id,
    company_name,
    company_type,
    managed_by_cfo_user_id,
    managed_by_cfo_company_id,
    managed_by_practice_name,
    granted_modules,
    project_managers,
    estimators,
    week_end_day,
    default_status,
    default_role,
    capacity_enabled
  ) VALUES (
    v_company_id,
    p_company_name,
    'managed',
    p_cfo_user_id,
    p_cfo_company_id,
    p_practice_name,
    p_granted_modules,
    '[]'::jsonb,
    '[]'::jsonb,
    'Friday',
    'Active',
    'owner',
    false
  );
  
  RETURN v_company_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_managed_companies(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_managed_company(TEXT, UUID, UUID, TEXT, JSONB, TEXT) TO authenticated;

-- Add comment for documentation
COMMENT ON COLUMN public.settings.company_type IS 'managed = CFO client company, direct = self-service subscriber';
COMMENT ON COLUMN public.settings.managed_by_cfo_user_id IS 'User ID of the CFO who manages this company';
COMMENT ON COLUMN public.settings.managed_by_practice_name IS 'Display name of the CFO practice (e.g., Junction Peak)';
COMMENT ON COLUMN public.settings.granted_modules IS 'Array of module IDs the CFO has granted to this client';
