/**
 * useCFOChat Hook
 * 
 * Manages state and API calls for the Coach Martin AI CFO chat.
 */

import { useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  ChatMessage,
  CFOChatRequest,
  CFOChatResponse,
  CFOChatError,
  SuggestedQuestion,
  UsageLimits,
} from '../types/ai';
import { Job, Settings, UserRole } from '../types';
import { buildAIContext, contextToPromptString } from '../lib/ai';
import { SUGGESTED_QUESTION_TEMPLATES } from '../lib/ai/systemPrompt';

// ============================================================================
// Types
// ============================================================================

interface UseCFOChatOptions {
  companyId: string | null;
  userId: string | null;
  jobs: Job[];
  settings: Settings | null;
  userRole: UserRole;
  currentView: string;
  pmFilter?: string;
}

interface UseCFOChatReturn {
  // State
  messages: ChatMessage[];
  isLoading: boolean;
  error: CFOChatError | null;
  usageLimits: UsageLimits | null;
  
  // Actions
  sendMessage: (message: string, jobId?: string) => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;
  
  // Computed
  suggestedQuestions: SuggestedQuestion[];
  isAvailable: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getSuggestedQuestions(
  currentView: string,
  selectedJobId?: string,
  messageCount: number = 0
): SuggestedQuestion[] {
  const questions: SuggestedQuestion[] = [];

  // If no messages yet, show general intro questions
  if (messageCount === 0) {
    questions.push(
      ...SUGGESTED_QUESTION_TEMPLATES.general.slice(0, 3).map(text => ({
        text,
        category: 'general' as const,
      }))
    );
  }

  // Add view-specific questions
  if (currentView === 'weekly-review' || currentView === 'weekly') {
    questions.push(
      ...SUGGESTED_QUESTION_TEMPLATES.weeklyReview.slice(0, 2).map(text => ({
        text,
        category: 'weekly-review' as const,
      }))
    );
  }

  // Add job-specific questions if a job is selected
  if (selectedJobId) {
    questions.push(
      ...SUGGESTED_QUESTION_TEMPLATES.jobSpecific.slice(0, 2).map(text => ({
        text,
        category: 'job-specific' as const,
        jobId: selectedJobId,
      }))
    );
  }

  // Add troubleshooting if there are already messages (follow-up)
  if (messageCount > 0) {
    questions.push(
      ...SUGGESTED_QUESTION_TEMPLATES.troubleshooting.slice(0, 2).map(text => ({
        text,
        category: 'troubleshooting' as const,
      }))
    );
  }

  return questions.slice(0, 5);
}

// ============================================================================
// Hook
// ============================================================================

export function useCFOChat(options: UseCFOChatOptions): UseCFOChatReturn {
  const { companyId, userId, jobs, settings, userRole, currentView, pmFilter } = options;

  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<CFOChatError | null>(null);
  const [usageLimits, setUsageLimits] = useState<UsageLimits | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>();

  // Check if AI is available
  const isAvailable = useMemo(() => {
    if (!companyId || !userId) return false;
    if (!settings?.aiEnabled) return false;
    return true;
  }, [companyId, userId, settings?.aiEnabled]);

  // Get suggested questions
  const suggestedQuestions = useMemo(() => {
    return getSuggestedQuestions(currentView, selectedJobId, messages.length);
  }, [currentView, selectedJobId, messages.length]);

  // Send a message
  const sendMessage = useCallback(async (message: string, jobId?: string) => {
    if (!companyId || !userId || !settings) {
      setError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
      return;
    }

    // Track selected job
    if (jobId) {
      setSelectedJobId(jobId);
    }

    // Add user message to state
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      jobContext: jobId ? jobs.find(j => j.id === jobId) ? {
        jobId,
        jobName: jobs.find(j => j.id === jobId)!.jobName,
        jobNo: jobs.find(j => j.id === jobId)!.jobNo,
      } : undefined : undefined,
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Build context
      const context = buildAIContext({
        jobs,
        settings,
        selectedJobId: jobId || selectedJobId,
        currentView,
        userRole,
        pmFilter,
      });

      // Prepare request
      const request: CFOChatRequest = {
        message,
        jobId: jobId || selectedJobId,
        currentView: currentView as CFOChatRequest['currentView'],
        conversationHistory: messages.slice(-5).map(m => ({
          role: m.role,
          content: m.content,
        })),
      };

      // Call edge function
      const { data, error: fnError } = await supabase.functions.invoke<CFOChatResponse>('ai-cfo-chat', {
        body: {
          ...request,
          context: contextToPromptString(context),
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data) {
        throw new Error('No response from AI');
      }

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
        sources: data.sources,
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Update usage if returned
      // TODO: Implement usage tracking on backend

    } catch (err) {
      console.error('CFO Chat error:', err);
      
      const chatError: CFOChatError = {
        code: 'API_ERROR',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
      };

      // Handle specific error types
      if (err instanceof Error) {
        if (err.message.includes('rate limit')) {
          chatError.code = 'RATE_LIMITED';
          chatError.message = 'You\'ve reached your question limit. Please try again later.';
          chatError.retryAfter = 3600; // 1 hour
        } else if (err.message.includes('unauthorized')) {
          chatError.code = 'UNAUTHORIZED';
          chatError.message = 'Please log in to use Coach Martin.';
        }
      }

      setError(chatError);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, userId, settings, jobs, userRole, currentView, pmFilter, messages, selectedJobId]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    setSelectedJobId(undefined);
    setError(null);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    usageLimits,
    sendMessage,
    clearMessages,
    clearError,
    suggestedQuestions,
    isAvailable,
  };
}

export default useCFOChat;
