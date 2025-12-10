import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Invitation, TeamMember, UserRole } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface UseInvitationsReturn {
  invitations: Invitation[];
  teamMembers: TeamMember[];
  loading: boolean;
  error: string | null;
  fetchInvitations: (companyId: string) => Promise<void>;
  fetchTeamMembers: (companyId: string) => Promise<void>;
  sendInvitation: (companyId: string, email: string, role: UserRole) => Promise<{ success: boolean; error?: string; invitation?: Invitation }>;
  cancelInvitation: (invitationId: string) => Promise<{ success: boolean; error?: string }>;
  resendInvitation: (invitationId: string) => Promise<{ success: boolean; error?: string }>;
  removeTeamMember: (companyId: string, userId: string) => Promise<{ success: boolean; error?: string }>;
}

export function useInvitations(): UseInvitationsReturn {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitations = useCallback(async (companyId: string) => {
    if (!companyId) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase!
        .from('invitations')
        .select('*')
        .eq('company_id', companyId)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const mapped: Invitation[] = (data || []).map(inv => ({
        id: inv.id,
        companyId: inv.company_id,
        email: inv.email,
        role: inv.role as UserRole,
        token: inv.token,
        invitedBy: inv.invited_by,
        createdAt: inv.created_at,
        expiresAt: inv.expires_at,
        acceptedAt: inv.accepted_at,
      }));

      setInvitations(mapped);
    } catch (err: any) {
      console.error('[useInvitations] Error fetching invitations:', err);
      setError(err.message || 'Failed to fetch invitations');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTeamMembers = useCallback(async (companyId: string) => {
    if (!companyId) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase!
        .rpc('get_team_members', { target_company_id: companyId });

      if (fetchError) throw fetchError;

      if (data?.success && data.members) {
        const mapped: TeamMember[] = data.members.map((m: any) => ({
          userId: m.user_id,
          email: m.email,
          role: m.role as UserRole,
          joinedAt: m.joined_at,
        }));
        setTeamMembers(mapped);
      } else {
        setTeamMembers([]);
      }
    } catch (err: any) {
      console.error('[useInvitations] Error fetching team members:', err);
      setError(err.message || 'Failed to fetch team members');
    } finally {
      setLoading(false);
    }
  }, []);

  const sendInvitation = useCallback(async (
    companyId: string,
    email: string,
    role: UserRole
  ): Promise<{ success: boolean; error?: string; invitation?: Invitation }> => {
    try {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Check if invitation already exists
      const { data: existing } = await supabase!
        .from('invitations')
        .select('id')
        .eq('email', email.toLowerCase())
        .eq('company_id', companyId)
        .is('accepted_at', null)
        .single();

      if (existing) {
        return { success: false, error: 'An invitation has already been sent to this email' };
      }

      // Get company name for the email
      const { data: settingsData } = await supabase!
        .from('settings')
        .select('company_name')
        .eq('company_id', companyId)
        .single();

      const companyName = settingsData?.company_name || 'WIP Insights';

      const { data, error: insertError } = await supabase!
        .from('invitations')
        .insert({
          company_id: companyId,
          email: email.toLowerCase().trim(),
          role,
          invited_by: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const invitation: Invitation = {
        id: data.id,
        companyId: data.company_id,
        email: data.email,
        role: data.role as UserRole,
        token: data.token,
        invitedBy: data.invited_by,
        createdAt: data.created_at,
        expiresAt: data.expires_at,
      };

      // Send invitation email via Edge Function
      const inviteLink = `${window.location.origin}/auth?invite=${data.token}`;

      try {
        const { data: { session } } = await supabase!.auth.getSession();

        const emailResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-invitation-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            to: email.toLowerCase().trim(),
            inviteLink,
            companyName,
            role,
            inviterEmail: user.email,
          }),
        });

        const emailResult = await emailResponse.json();

        if (!emailResponse.ok) {
          console.warn('[useInvitations] Email sending failed, but invitation was created:', emailResult);
          // Don't fail the whole operation - invitation was created, email just didn't send
        }
      } catch (emailErr) {
        console.warn('[useInvitations] Error sending email (invitation still created):', emailErr);
        // Don't fail - the invitation link can still be copied manually
      }

      setInvitations(prev => [invitation, ...prev]);

      return { success: true, invitation };
    } catch (err: any) {
      console.error('[useInvitations] Error sending invitation:', err);
      return { success: false, error: err.message || 'Failed to send invitation' };
    }
  }, []);

  const cancelInvitation = useCallback(async (invitationId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error: deleteError } = await supabase!
        .from('invitations')
        .delete()
        .eq('id', invitationId);

      if (deleteError) throw deleteError;

      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      return { success: true };
    } catch (err: any) {
      console.error('[useInvitations] Error canceling invitation:', err);
      return { success: false, error: err.message || 'Failed to cancel invitation' };
    }
  }, []);

  const resendInvitation = useCallback(async (invitationId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Get the invitation details first
      const invitation = invitations.find(inv => inv.id === invitationId);
      if (!invitation) {
        return { success: false, error: 'Invitation not found' };
      }

      // Update expires_at to extend the invitation
      const { error: updateError } = await supabase!
        .from('invitations')
        .update({
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', invitationId);

      if (updateError) throw updateError;

      // Get company name for the email
      const { data: settingsData } = await supabase!
        .from('settings')
        .select('company_name')
        .eq('company_id', invitation.companyId)
        .single();

      const companyName = settingsData?.company_name || 'WIP Insights';

      // Resend the invitation email
      const inviteLink = `${window.location.origin}/auth?invite=${invitation.token}`;

      try {
        const { data: { session } } = await supabase!.auth.getSession();
        const { data: { user } } = await supabase!.auth.getUser();

        const emailResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-invitation-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            to: invitation.email,
            inviteLink,
            companyName,
            role: invitation.role,
            inviterEmail: user?.email,
          }),
        });

        if (!emailResponse.ok) {
          const emailResult = await emailResponse.json();
          console.warn('[useInvitations] Email resend failed:', emailResult);
        }
      } catch (emailErr) {
        console.warn('[useInvitations] Error resending email:', emailErr);
      }

      // Update local state
      setInvitations(prev => prev.map(inv =>
        inv.id === invitationId
          ? { ...inv, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() }
          : inv
      ));

      return { success: true };
    } catch (err: any) {
      console.error('[useInvitations] Error resending invitation:', err);
      return { success: false, error: err.message || 'Failed to resend invitation' };
    }
  }, [invitations]);

  const removeTeamMember = useCallback(async (companyId: string, userId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error: deleteError } = await supabase!
        .from('profiles')
        .delete()
        .eq('user_id', userId)
        .eq('company_id', companyId);

      if (deleteError) throw deleteError;

      setTeamMembers(prev => prev.filter(m => m.userId !== userId));
      return { success: true };
    } catch (err: any) {
      console.error('[useInvitations] Error removing team member:', err);
      return { success: false, error: err.message || 'Failed to remove team member' };
    }
  }, []);

  return {
    invitations,
    teamMembers,
    loading,
    error,
    fetchInvitations,
    fetchTeamMembers,
    sendInvitation,
    cancelInvitation,
    resendInvitation,
    removeTeamMember,
  };
}

// Helper to accept an invitation (used in AuthPage)
export async function acceptInvitation(token: string): Promise<{ success: boolean; error?: string; companyId?: string; role?: string }> {
  try {
    const { data, error } = await supabase!.rpc('accept_invitation', { invitation_token: token });

    if (error) throw error;

    if (data?.success) {
      return { success: true, companyId: data.company_id, role: data.role };
    } else {
      return { success: false, error: data?.error || 'Failed to accept invitation' };
    }
  } catch (err: any) {
    console.error('[acceptInvitation] Error:', err);
    return { success: false, error: err.message || 'Failed to accept invitation' };
  }
}

// Helper to get invitation details by token (used in AuthPage)
export async function getInvitationByToken(token: string): Promise<{
  valid: boolean;
  email?: string;
  role?: string;
  companyName?: string;
  expiresAt?: string;
  error?: string;
}> {
  try {
    const { data, error } = await supabase!.rpc('get_invitation_by_token', { invitation_token: token });

    if (error) throw error;

    if (data?.valid) {
      return {
        valid: true,
        email: data.email,
        role: data.role,
        companyName: data.company_name,
        expiresAt: data.expires_at,
      };
    } else {
      return { valid: false, error: data?.error || 'Invalid invitation' };
    }
  } catch (err: any) {
    console.error('[getInvitationByToken] Error:', err);
    return { valid: false, error: err.message || 'Failed to verify invitation' };
  }
}

