/**
 * Engagement Dashboard Component
 * 
 * Main view for managing CFO engagements and interview status.
 * Shows all engagements with their interview completion status.
 */

import React, { useState, useEffect } from 'react';
import { 
  Engagement, 
  InterviewSession, 
  InterviewRole,
  ROLE_DISPLAY_NAMES, 
  ROLE_ICONS 
} from '../types';
import { getTemplateByRole, getTemplateQuestionCount } from '../templates';

interface EngagementDashboardProps {
  engagements: Engagement[];
  onCreateEngagement: (data: Partial<Engagement>) => Promise<Engagement | null>;
  onSelectEngagement: (engagement: Engagement) => void;
  onStartInterview: (engagement: Engagement, session: InterviewSession) => void;
  getInterviewSessions: (engagementId: string) => Promise<InterviewSession[]>;
}

export const EngagementDashboard: React.FC<EngagementDashboardProps> = ({
  engagements,
  onCreateEngagement,
  onSelectEngagement,
  onStartInterview,
  getInterviewSessions,
}) => {
  const [showNewForm, setShowNewForm] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // Expanded engagement (to show interviews)
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Record<string, InterviewSession[]>>({});
  const [loadingSessions, setLoadingSessions] = useState<string | null>(null);

  // Load sessions when an engagement is expanded
  useEffect(() => {
    if (expandedId && !sessions[expandedId]) {
      setLoadingSessions(expandedId);
      getInterviewSessions(expandedId).then(data => {
        setSessions(prev => ({ ...prev, [expandedId]: data }));
        setLoadingSessions(null);
      });
    }
  }, [expandedId, getInterviewSessions, sessions]);

  const handleCreateEngagement = async () => {
    if (!newCompanyName.trim()) return;
    
    setIsCreating(true);
    const result = await onCreateEngagement({
      companyName: newCompanyName.trim(),
      industry: newIndustry.trim() || undefined,
    });
    
    if (result) {
      setNewCompanyName('');
      setNewIndustry('');
      setShowNewForm(false);
      setExpandedId(result.id);
    }
    setIsCreating(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'discovery': return 'bg-blue-500';
      case 'analysis': return 'bg-purple-500';
      case 'planning': return 'bg-amber-500';
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getInterviewStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✓';
      case 'in-progress': return '◐';
      case 'scheduled': return '○';
      case 'cancelled': return '✗';
      default: return '○';
    }
  };

  const getInterviewProgress = (session: InterviewSession) => {
    const template = getTemplateByRole(session.role);
    const totalQuestions = getTemplateQuestionCount(template);
    const answeredQuestions = session.responses.filter(r => !r.skipped).length;
    return Math.round((answeredQuestions / totalQuestions) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="text-3xl">🎯</span>
                Executive Discovery
              </h1>
              <p className="text-slate-400 mt-1">
                Conduct structured interviews with leadership teams
              </p>
            </div>
            
            <button
              onClick={() => setShowNewForm(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-xl shadow-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Engagement
            </button>
          </div>
        </div>
      </div>

      {/* New Engagement Form */}
      {showNewForm && (
        <div className="max-w-6xl mx-auto px-6 pt-6">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Start New Engagement</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Company Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="Enter company name"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Industry
                </label>
                <input
                  type="text"
                  value={newIndustry}
                  onChange={(e) => setNewIndustry(e.target.value)}
                  placeholder="e.g., Construction, Manufacturing"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowNewForm(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEngagement}
                disabled={!newCompanyName.trim() || isCreating}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCreating ? 'Creating...' : 'Create Engagement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Engagements List */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {engagements.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🎯</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Engagements Yet</h3>
            <p className="text-slate-400 mb-6">
              Start a new engagement to begin interviewing leadership teams.
            </p>
            <button
              onClick={() => setShowNewForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl"
            >
              Start Your First Engagement
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {engagements.map(engagement => {
              const isExpanded = expandedId === engagement.id;
              const engagementSessions = sessions[engagement.id] || [];
              const completedCount = engagementSessions.filter(s => s.status === 'completed').length;
              
              return (
                <div
                  key={engagement.id}
                  className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
                >
                  {/* Engagement Header */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : engagement.id)}
                    className="p-5 cursor-pointer hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
                          <span className="text-2xl">🏢</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{engagement.companyName}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            {engagement.industry && (
                              <span className="text-sm text-slate-400">{engagement.industry}</span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${getStatusColor(engagement.status)}`}>
                              {engagement.status.charAt(0).toUpperCase() + engagement.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {/* Interview progress indicators */}
                        <div className="flex items-center gap-1">
                          {(['ceo', 'controller', 'operations', 'sales'] as InterviewRole[]).map(role => {
                            const session = engagementSessions.find(s => s.role === role);
                            const isComplete = session?.status === 'completed';
                            const isInProgress = session?.status === 'in-progress';
                            
                            return (
                              <div
                                key={role}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                                  isComplete 
                                    ? 'bg-green-500/20' 
                                    : isInProgress 
                                    ? 'bg-amber-500/20' 
                                    : 'bg-slate-700'
                                }`}
                                title={`${ROLE_DISPLAY_NAMES[role]}: ${session?.status || 'scheduled'}`}
                              >
                                {ROLE_ICONS[role]}
                              </div>
                            );
                          })}
                        </div>
                        
                        <span className="text-sm text-slate-400">
                          {completedCount}/4 complete
                        </span>
                        
                        <svg 
                          className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Interview Sessions */}
                  {isExpanded && (
                    <div className="border-t border-slate-700 bg-slate-900/50 p-5">
                      {loadingSessions === engagement.id ? (
                        <div className="text-center py-8">
                          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                          <p className="text-slate-400 mt-2">Loading interviews...</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(['ceo', 'controller', 'operations', 'sales'] as InterviewRole[]).map(role => {
                            const session = engagementSessions.find(s => s.role === role);
                            if (!session) return null;
                            
                            const template = getTemplateByRole(role);
                            const progress = getInterviewProgress(session);
                            const isComplete = session.status === 'completed';
                            const isInProgress = session.status === 'in-progress';
                            
                            return (
                              <div
                                key={role}
                                className={`p-4 rounded-xl border ${
                                  isComplete
                                    ? 'bg-green-500/10 border-green-500/30'
                                    : isInProgress
                                    ? 'bg-amber-500/10 border-amber-500/30'
                                    : 'bg-slate-800 border-slate-700'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                                      isComplete ? 'bg-green-500/20' : isInProgress ? 'bg-amber-500/20' : 'bg-slate-700'
                                    }`}>
                                      {ROLE_ICONS[role]}
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-white">{ROLE_DISPLAY_NAMES[role]}</h4>
                                      <p className="text-sm text-slate-400">
                                        {session.intervieweeName || 'Not assigned'}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <span className={`text-lg ${
                                    isComplete ? 'text-green-400' : isInProgress ? 'text-amber-400' : 'text-slate-500'
                                  }`}>
                                    {getInterviewStatusIcon(session.status)}
                                  </span>
                                </div>

                                {/* Progress bar */}
                                {(isInProgress || isComplete) && (
                                  <div className="mt-3">
                                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                                      <span>{progress}% complete</span>
                                      <span>~{template.estimatedMinutes} min</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full transition-all ${isComplete ? 'bg-green-500' : 'bg-amber-500'}`}
                                        style={{ width: `${progress}%` }}
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Actions */}
                                <div className="mt-4 flex gap-2">
                                  {isComplete ? (
                                    <button
                                      onClick={() => onStartInterview(engagement, session)}
                                      className="flex-1 px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                                    >
                                      Review Responses
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => onStartInterview(engagement, session)}
                                      className="flex-1 px-3 py-2 text-sm bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium rounded-lg transition-colors"
                                    >
                                      {isInProgress ? 'Continue Interview' : 'Start Interview'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Engagement Actions */}
                      <div className="mt-6 pt-4 border-t border-slate-700 flex justify-between items-center">
                        <div className="text-sm text-slate-400">
                          Started {new Date(engagement.startDate).toLocaleDateString()}
                        </div>
                        <div className="flex gap-2">
                          {completedCount === 4 && engagement.status === 'discovery' && (
                            <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors">
                              Run AI Analysis
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EngagementDashboard;

