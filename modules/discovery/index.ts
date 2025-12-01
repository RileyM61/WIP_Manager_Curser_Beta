/**
 * Discovery Module
 * 
 * Executive Discovery/Interview module for CFO engagements.
 * Enables structured interviews with CEO and leadership team,
 * AI-powered analysis, and Value Builder integration.
 */

// Types
export * from './types';

// Templates
export * from './templates';

// Hooks
export * from './hooks';

// Components
export * from './components';

// Module metadata
export const DISCOVERY_MODULE = {
  id: 'discovery' as const,
  name: 'Executive Discovery',
  shortName: 'Discovery',
  description: 'Structured interviews with leadership team, AI analysis, and strategic recommendations',
  icon: '🎯',
};

// Re-export key types for convenience
export type {
  Engagement,
  InterviewSession,
  InterviewTemplate,
  InterviewQuestion,
  InterviewResponse,
  DiscoveryAnalysis,
  StrategicRecommendation,
  LeadershipAlignment,
  ValueBuilderInputs,
} from './types';

