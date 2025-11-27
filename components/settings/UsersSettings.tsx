import React, { useState, useEffect } from 'react';
import { useInvitations } from '../../hooks/useInvitations';
import { UserRole } from '../../types';

interface UsersSettingsProps {
  companyId: string;
  currentUserId: string;
}

const UsersSettings: React.FC<UsersSettingsProps> = ({ companyId, currentUserId }) => {
  const {
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
  } = useInvitations();

  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('projectManager');
  const [sending, setSending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    if (companyId) {
      fetchInvitations(companyId);
      fetchTeamMembers(companyId);
    }
  }, [companyId, fetchInvitations, fetchTeamMembers]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setSending(true);
    setLocalError(null);
    setSuccessMessage(null);

    try {
      const result = await sendInvitation(companyId, newEmail.trim(), newRole);
      if (result.success) {
        setSuccessMessage(`Invitation sent to ${newEmail}`);
        setNewEmail('');
        fetchInvitations(companyId);
      } else {
        setLocalError(result.error || 'Failed to send invitation');
      }
    } catch (err) {
      setLocalError('An unexpected error occurred');
    } finally {
      setSending(false);
    }
  };

  const handleCancelInvite = async (invitationId: string) => {
    const result = await cancelInvitation(invitationId);
    if (result.success) {
      fetchInvitations(companyId);
    } else {
      setLocalError(result.error || 'Failed to cancel invitation');
    }
  };

  const handleResendInvite = async (invitationId: string) => {
    const result = await resendInvitation(invitationId);
    if (result.success) {
      setSuccessMessage('Invitation resent successfully');
      fetchInvitations(companyId);
    } else {
      setLocalError(result.error || 'Failed to resend invitation');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;
    
    const result = await removeTeamMember(companyId, userId);
    if (result.success) {
      fetchTeamMembers(companyId);
    } else {
      setLocalError(result.error || 'Failed to remove team member');
    }
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/auth?invite=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const pendingInvitations = invitations.filter(inv => !inv.acceptedAt);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">Users & Team</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Invite team members and manage access to your company's WIP data.
        </p>
      </div>

      {/* Error/Success Messages */}
      {(localError || error) && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300 text-sm">
          {localError || error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-green-700 dark:text-green-300 text-sm">
          {successMessage}
        </div>
      )}

      {/* Invite New User */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-4">Invite Team Member</h3>
        
        <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Email address"
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200"
            required
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as UserRole)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200"
          >
            <option value="projectManager">Project Manager</option>
            <option value="estimator">Estimator</option>
            <option value="owner">Owner</option>
          </select>
          <button
            type="submit"
            disabled={sending || !newEmail.trim()}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? 'Sending...' : 'Send Invite'}
          </button>
        </form>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-4">Pending Invitations</h3>
          
          <div className="space-y-3">
            {pendingInvitations.map(invitation => (
              <div
                key={invitation.id}
                className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{invitation.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Role: {invitation.role} • Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyInviteLink(invitation.token)}
                    className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  >
                    {copiedToken === invitation.token ? 'Copied!' : 'Copy Link'}
                  </button>
                  <button
                    onClick={() => handleResendInvite(invitation.id)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Resend
                  </button>
                  <button
                    onClick={() => handleCancelInvite(invitation.id)}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Members */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-4">Team Members</h3>
        
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading team members...</div>
        ) : teamMembers.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No team members yet. Send an invitation to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {teamMembers.map(member => (
              <div
                key={member.userId}
                className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{member.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {member.role === 'owner' ? '👑 Owner' : member.role === 'projectManager' ? '📋 Project Manager' : '📐 Estimator'}
                    {' • '}Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </p>
                </div>
                {member.userId !== currentUserId && member.role !== 'owner' && (
                  <button
                    onClick={() => handleRemoveMember(member.userId)}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                )}
                {member.userId === currentUserId && (
                  <span className="text-xs text-gray-400 italic">You</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersSettings;

