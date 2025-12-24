import React, { useState, useEffect } from 'react';
import { XIcon } from '../shared/icons';
import { useInvitations } from '../../hooks/useInvitations';
import { Invitation, TeamMember, UserRole } from '../../types';

interface TeamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  currentUserId: string;
}

const TeamManagementModal: React.FC<TeamManagementModalProps> = ({
  isOpen,
  onClose,
  companyId,
  currentUserId,
}) => {
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
    if (isOpen && companyId) {
      fetchInvitations(companyId);
      fetchTeamMembers(companyId);
    }
  }, [isOpen, companyId, fetchInvitations, fetchTeamMembers]);

  if (!isOpen) return null;

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setSending(true);
    setLocalError(null);
    setSuccessMessage(null);

    const result = await sendInvitation(newEmail.trim(), newRole, companyId);

    if (result.success) {
      setNewEmail('');
      setSuccessMessage(`Invitation sent to ${newEmail}`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } else {
      setLocalError(result.error || 'Failed to send invitation');
    }

    setSending(false);
  };

  const handleCancelInvite = async (invitationId: string) => {
    const result = await cancelInvitation(invitationId);
    if (!result.success) {
      setLocalError(result.error || 'Failed to cancel invitation');
    }
  };

  const handleResendInvite = async (invitationId: string, email: string) => {
    const result = await resendInvitation(invitationId);
    if (result.success) {
      setSuccessMessage(`Invitation resent to ${email}`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } else {
      setLocalError(result.error || 'Failed to resend invitation');
    }
  };

  const handleRemoveMember = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from the team?`)) {
      return;
    }
    const result = await removeTeamMember(companyId, userId);
    if (result.success) {
      setSuccessMessage(`${email} has been removed from the team`);
      setTimeout(() => setSuccessMessage(null), 5000);
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

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return 'bg-wip-card text-wip-gold-dark dark:bg-wip-gold/30 dark:text-wip-gold';
      case 'projectManager':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'estimator':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return 'Owner';
      case 'projectManager':
        return 'Project Manager';
      case 'estimator':
        return 'Estimator';
      default:
        return role;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expires = new Date(expiresAt);
    const now = new Date();
    const daysUntilExpiry = (expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry < 2;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b dark:border-gray-700 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Team Management</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Invite team members and manage access
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XIcon />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {/* Error/Success Messages */}
          {(error || localError) && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-4 py-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error || localError}</p>
            </div>
          )}
          {successMessage && (
            <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 px-4 py-3">
              <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>
            </div>
          )}

          {/* Invite Form */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
              Invite New Team Member
            </h3>
            <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Email address"
                required
                className="flex-grow border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wip-gold dark:bg-gray-700 dark:text-gray-200"
              />
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wip-gold dark:bg-gray-700 dark:text-gray-200"
              >
                <option value="projectManager">Project Manager</option>
                <option value="estimator">Estimator</option>
                <option value="owner">Owner</option>
              </select>
              <button
                type="submit"
                disabled={sending || !newEmail.trim()}
                className="bg-wip-gold hover:bg-wip-gold-dark text-white font-medium px-6 py-2 rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {sending ? 'Sending...' : 'Send Invite'}
              </button>
            </form>
          </div>

          {/* Pending Invitations */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
              Pending Invitations ({invitations.length})
            </h3>
            {invitations.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">No pending invitations</p>
            ) : (
              <div className="space-y-2">
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                        <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{inv.email}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(inv.role)}`}>
                            {getRoleLabel(inv.role)}
                          </span>
                          <span className={`text-xs ${isExpiringSoon(inv.expiresAt) ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
                            Expires {formatDate(inv.expiresAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyInviteLink(inv.token)}
                        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                        title="Copy invite link"
                      >
                        {copiedToken === inv.token ? '✓ Copied' : 'Copy Link'}
                      </button>
                      <button
                        onClick={() => handleResendInvite(inv.id, inv.email)}
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        Resend
                      </button>
                      <button
                        onClick={() => handleCancelInvite(inv.id)}
                        className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Team Members */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              Team Members ({teamMembers.length})
            </h3>
            {loading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
            ) : teamMembers.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">No team members yet</p>
            ) : (
              <div className="space-y-2">
                {teamMembers.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {member.email}
                          {member.userId === currentUserId && (
                            <span className="ml-2 text-xs text-gray-400">(you)</span>
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(member.role)}`}>
                            {getRoleLabel(member.role)}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            Joined {formatDate(member.joinedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {member.userId !== currentUserId && (
                      <button
                        onClick={() => handleRemoveMember(member.userId, member.email)}
                        className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">How invitations work</h4>
            <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
              <li>• Invitations are valid for 7 days</li>
              <li>• Invited users will receive a link to sign up</li>
              <li>• You can also copy the invite link and share it directly</li>
              <li>• Once accepted, team members can access shared company data</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-200 dark:bg-gray-600 py-2 px-6 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamManagementModal;

