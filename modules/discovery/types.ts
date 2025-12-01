/**
 * Discovery Module Types
 * 
 * Type definitions for the Executive Discovery/Interview module.
 * Used for conducting structured interviews with CEO and leadership team.
 */

// ============================================================================
// Core Enums
// ============================================================================

export type InterviewRole = 'ceo' | 'controller' | 'operations' | 'sales';

export type EngagementStatus = 'discovery' | 'analysis' | 'planning' | 'active' | 'completed';

export type InterviewStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

export type QuestionType = 'text' | 'textarea' | 'scale' | 'multiple-choice' | 'yes-no' | 'currency' | 'percentage' | 'number';

export type QuestionCategory = 
  | 'vision' 
  | 'growth' 
  | 'challenges' 
  | 'financial' 
  | 'operations' 
  | 'people' 
  | 'market' 
  | 'risk' 
  | 'systems' 
  | 'customers'
  | 'strategy';

export type InsightSeverity = 'low' | 'medium' | 'high';

export type RecommendationPriority = 1 | 2 | 3;

export type RecommendationTimeframe = 'immediate' | '30-days' | '90-days' | '6-months' | '12-months';

// ============================================================================
// Interview Template Types
// ============================================================================

export interface InterviewQuestion {
  id: string;
  text: string;
  helpText?: string;                  // Guidance for interviewer
  type: QuestionType;
  category: QuestionCategory;
  options?: string[];                 // For multiple-choice
  scaleMin?: number;                  // For scale (default 1)
  scaleMax?: number;                  // For scale (default 10)
  scaleLabels?: { 
    low: string; 
    mid?: string;
    high: string; 
  };
  required: boolean;
  followUp?: string;                  // Prompt for follow-up discussion
  aiAnalysisHint?: string;            // Hint for AI when analyzing this response
}

export interface InterviewSection {
  id: string;
  title: string;
  description: string;
  icon?: string;                      // Emoji for visual identification
  questions: InterviewQuestion[];
}

export interface InterviewTemplate {
  id: string;
  role: InterviewRole;
  name: string;
  description: string;
  sections: InterviewSection[];
  estimatedMinutes: number;
  version: string;
}

// ============================================================================
// Engagement Types
// ============================================================================

export interface Engagement {
  id: string;
  companyId: string;
  companyName: string;
  industry?: string;
  annualRevenue?: number;
  employeeCount?: number;
  cfoUserId: string;
  cfoName: string;
  status: EngagementStatus;
  startDate: string;
  completedDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Interview Session Types
// ============================================================================

export interface InterviewResponse {
  questionId: string;
  sectionId: string;
  value: string | number | boolean | string[];
  notes?: string;                     // Interviewer observations
  skipped?: boolean;
  timestamp: string;
}

export interface InterviewSession {
  id: string;
  engagementId: string;
  templateId: string;
  role: InterviewRole;
  
  // Interviewee info
  intervieweeName: string;
  intervieweeTitle: string;
  intervieweeEmail?: string;
  intervieweePhone?: string;
  
  // Scheduling
  scheduledDate?: string;
  conductedDate?: string;
  conductedBy: string;
  
  // Status & Progress
  status: InterviewStatus;
  currentSectionIndex?: number;
  currentQuestionIndex?: number;
  
  // Responses
  responses: InterviewResponse[];
  
  // Meta
  interviewerNotes?: string;          // Free-form notes during interview
  duration?: number;                  // Minutes
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// AI Analysis Types
// ============================================================================

export interface AnalysisInsight {
  id: string;
  title: string;
  description: string;
  source: string;                     // "CEO Interview", "Controller Interview"
  questionIds?: string[];             // Which questions led to this insight
  severity: InsightSeverity;
  category: QuestionCategory;
}

export interface MultipleAdjustment {
  factor: string;                     // "Owner Dependency", "Customer Concentration"
  currentState: string;               // Description of current state
  impact: number;                     // -1.0 to +1.0 (negative reduces multiple)
  reasoning: string;
  sourceInterviews: InterviewRole[];
}

export interface StrategicRecommendation {
  id: string;
  priority: RecommendationPriority;
  title: string;
  description: string;
  rationale: string;
  timeframe: RecommendationTimeframe;
  expectedImpact: string;
  valueBuilderImpact?: string;        // How it affects valuation
  assignedTo?: string;
  status?: 'pending' | 'in-progress' | 'completed';
}

export interface LeadershipAlignmentArea {
  area: string;                       // "Growth Strategy", "Priority Challenges"
  score: number;                      // 1-10
  gap?: string;                       // Description of misalignment
  ceoView?: string;
  teamView?: string;
}

export interface LeadershipAlignment {
  overallScore: number;               // 1-10
  summary: string;
  areaScores: LeadershipAlignmentArea[];
}

export interface ValueBuilderInputs {
  estimatedRevenue?: number;
  estimatedEbitda?: number;
  suggestedMultiple?: number;
  multipleFactors: MultipleAdjustment[];
  confidenceLevel: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface DiscoveryAnalysis {
  id: string;
  engagementId: string;
  generatedAt: string;
  
  // Executive Summary
  executiveSummary: string;
  
  // SWOT Analysis
  strengths: AnalysisInsight[];
  weaknesses: AnalysisInsight[];
  opportunities: AnalysisInsight[];
  threats: AnalysisInsight[];
  
  // Value Builder Integration
  valueBuilderInputs: ValueBuilderInputs;
  
  // Strategic Recommendations
  recommendations: StrategicRecommendation[];
  
  // Leadership Alignment
  leadershipAlignment: LeadershipAlignment;
  
  // AI Processing Info
  modelUsed?: string;
  processingTime?: number;
  
  updatedAt: string;
}

// ============================================================================
// Helper Types
// ============================================================================

export interface EngagementSummary {
  engagement: Engagement;
  interviews: {
    role: InterviewRole;
    status: InterviewStatus;
    intervieweeName?: string;
    completedDate?: string;
  }[];
  analysisComplete: boolean;
  completionPercentage: number;
}

export interface InterviewProgress {
  totalQuestions: number;
  answeredQuestions: number;
  skippedQuestions: number;
  percentComplete: number;
  currentSection: string;
  estimatedTimeRemaining: number;     // Minutes
}

// Role display names
export const ROLE_DISPLAY_NAMES: Record<InterviewRole, string> = {
  ceo: 'CEO / Owner',
  controller: 'Controller / CFO',
  operations: 'Operations Manager',
  sales: 'Sales Manager',
};

export const ROLE_ICONS: Record<InterviewRole, string> = {
  ceo: '👔',
  controller: '📊',
  operations: '⚙️',
  sales: '📈',
};

