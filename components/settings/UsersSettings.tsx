import React, { useState, useEffect } from 'react';
import { useInvitations } from '../../hooks/useInvitations';
import { Settings, UserRole } from '../../types';

interface UsersSettingsProps {
  companyId: string;
  currentUserId: string;
  settings: Settings;
  onChange: (settings: Partial<Settings>) => void;
  onSave: () => void;
}

const UsersSettings: React.FC<UsersSettingsProps> = ({ companyId, currentUserId, settings, onChange, onSave }) => {
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

  // PM & Estimator List State
  const [newPm, setNewPm] = useState('');
  const [newEstimator, setNewEstimator] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const handleAddPm = () => {
    if (newPm.trim() && !settings.projectManagers.includes(newPm.trim())) {
      onChange({
        projectManagers: [...settings.projectManagers, newPm.trim()].sort(),
      });
      setNewPm('');
      setHasChanges(true);
    }
  };

  const handleRemovePm = (pmToRemove: string) => {
    onChange({
      projectManagers: settings.projectManagers.filter(pm => pm !== pmToRemove),
    });
    setHasChanges(true);
  };

  const handleAddEstimator = () => {
    if (newEstimator.trim() && !settings.estimators.includes(newEstimator.trim())) {
      onChange({
        estimators: [...settings.estimators, newEstimator.trim()].sort(),
      });
      setNewEstimator('');
      setHasChanges(true);
    }
  };

  const handleRemoveEstimator = (estimatorToRemove: string) => {
    onChange({
      estimators: settings.estimators.filter(est => est !== estimatorToRemove),
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave();
    setHasChanges(false);
  };

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

      {/* Manual PM & Estimator Lists */}
      <div className="space-y-6">
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Job Assignments</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Define the list of Project Managers and Estimators that can be assigned to jobs in the dropdowns.
            <br className="hidden sm:block" />
            <span className="italic opacity-80">Note: Listing a name here does not give them user access. Invite them above to give access.</span>
          </p>
        </div>

        {/* Project Managers */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-1">Project Managers List</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Names available in the "Project Manager" dropdown on jobs.
          </p>

          <div className="space-y-2 mb-4">
            {settings.projectManagers.map(pm => (
              <div key={pm} className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <span className="text-sm text-gray-800 dark:text-gray-200">{pm}</span>
                <button
                  type="button"
                  onClick={() => handleRemovePm(pm)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
            {settings.projectManagers.length === 0 && (
              <p className="text-sm text-gray-400 italic">No project managers added yet</p>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newPm}
              onChange={(e) => setNewPm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddPm()}
              placeholder="Add new PM name"
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200"
            />
            <button
              type="button"
              onClick={handleAddPm}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Estimators */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-1">Estimators List</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Names available in the "Estimator" dropdown on jobs.
          </p>

          <div className="space-y-2 mb-4">
            {settings.estimators.map(estimator => (
              <div key={estimator} className="flex items-center justify-between bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                <span className="text-sm text-gray-800 dark:text-gray-200">{estimator}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveEstimator(estimator)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
            {settings.estimators.length === 0 && (
              <p className="text-sm text-gray-400 italic">No estimators added yet</p>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newEstimator}
              onChange={(e) => setNewEstimator(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddEstimator()}
              placeholder="Add new Estimator name"
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-200"
            />
            <button
              type="button"
              onClick={handleAddEstimator}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="fixed bottom-6 right-8 z-50 animate-bounce-subtle">
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-3 bg-blue-600 text-white rounded-full text-base font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <span>Save Changes</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div >
  );
};

export default UsersSettings;

