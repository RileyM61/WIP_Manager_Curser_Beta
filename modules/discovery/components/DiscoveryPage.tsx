/**
 * Discovery Page Component
 * 
 * Main container for the Discovery module.
 * Manages state between dashboard and interview conductor views.
 */

import React, { useState, useCallback } from 'react';
import { Engagement, InterviewSession, InterviewResponse } from '../types';
import { useEngagements } from '../hooks/useEngagements';
import { EngagementDashboard } from './EngagementDashboard';
import { InterviewConductor } from './InterviewConductor';

type ViewMode = 'dashboard' | 'interview';

interface ActiveInterview {
  engagement: Engagement;
  session: InterviewSession;
}

export const DiscoveryPage: React.FC = () => {
  const {
    engagements,
    loading,
    error,
    createEngagement,
    updateEngagement,
    getInterviewSessions,
    updateInterviewSession,
    saveInterviewResponse,
    refresh,
  } = useEngagements();

  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [activeInterview, setActiveInterview] = useState<ActiveInterview | null>(null);

  // Start or continue an interview
  const handleStartInterview = useCallback((engagement: Engagement, session: InterviewSession) => {
    // Update session status to in-progress if it's scheduled
    if (session.status === 'scheduled') {
      updateInterviewSession(session.id, { status: 'in-progress' });
    }
    
    setActiveInterview({ engagement, session });
    setViewMode('interview');
  }, [updateInterviewSession]);

  // Handle saving a response
  const handleSaveResponse = useCallback(async (response: InterviewResponse): Promise<boolean> => {
    if (!activeInterview) return false;
    return await saveInterviewResponse(activeInterview.session.id, response);
  }, [activeInterview, saveInterviewResponse]);

  // Handle updating session
  const handleUpdateSession = useCallback(async (data: Partial<InterviewSession>): Promise<boolean> => {
    if (!activeInterview) return false;
    const success = await updateInterviewSession(activeInterview.session.id, data);
    
    // Update local state
    if (success) {
      setActiveInterview(prev => prev ? {
        ...prev,
        session: { ...prev.session, ...data }
      } : null);
    }
    
    return success;
  }, [activeInterview, updateInterviewSession]);

  // Handle interview completion
  const handleCompleteInterview = useCallback(() => {
    setViewMode('dashboard');
    setActiveInterview(null);
    refresh();
  }, [refresh]);

  // Handle exit from interview
  const handleExitInterview = useCallback(() => {
    setViewMode('dashboard');
    setActiveInterview(null);
    refresh();
  }, [refresh]);

  // Show loading state
  if (loading && engagements.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 mt-4">Loading engagements...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && engagements.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Error Loading Data</h3>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={refresh}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render based on view mode
  if (viewMode === 'interview' && activeInterview) {
    return (
      <InterviewConductor
        session={activeInterview.session}
        onSaveResponse={handleSaveResponse}
        onUpdateSession={handleUpdateSession}
        onComplete={handleCompleteInterview}
        onExit={handleExitInterview}
      />
    );
  }

  return (
    <EngagementDashboard
      engagements={engagements}
      onCreateEngagement={createEngagement}
      onSelectEngagement={() => {}}
      onStartInterview={handleStartInterview}
      getInterviewSessions={getInterviewSessions}
    />
  );
};

export default DiscoveryPage;

