/**
 * AI CFO Chat Types
 * 
 * Types for the AI CFO Coach feature - "Coach Martin"
 */

// ============================================================================
// Chat Message Types
// ============================================================================

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  /** Source documents referenced in the response */
  sources?: KnowledgeSource[];
  /** If this message is about a specific job */
  jobContext?: JobContext;
}

export interface KnowledgeSource {
  id: string;
  title: string;
  section: string;
  /** Relevance score from vector search (0-1) */
  relevance: number;
}

export interface JobContext {
  jobId: string;
  jobName: string;
  jobNo: string;
}

// ============================================================================
// Chat Session Types
// ============================================================================

export interface ChatSession {
  id: string;
  companyId: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: string;
  lastMessageAt: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CFOChatRequest {
  message: string;
  /** Optional: context about a specific job */
  jobId?: string;
  /** Optional: what view/screen the user is on */
  currentView?: 'jobs' | 'company' | 'forecast' | 'weekly-review';
  /** Previous messages for conversation context (last 5) */
  conversationHistory?: Pick<ChatMessage, 'role' | 'content'>[];
}

export interface CFOChatResponse {
  message: string;
  sources: KnowledgeSource[];
  /** Suggested follow-up questions */
  suggestions?: string[];
  /** Token usage for cost tracking */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface CFOChatError {
  code: 'RATE_LIMITED' | 'API_ERROR' | 'CONTEXT_TOO_LARGE' | 'UNAUTHORIZED' | 'UNKNOWN';
  message: string;
  retryAfter?: number; // seconds until retry allowed
}

// ============================================================================
// Knowledge Embedding Types
// ============================================================================

export interface KnowledgeEmbedding {
  id: string;
  documentId: string;
  documentTitle: string;
  documentSection: string;
  chunkIndex: number;
  content: string;
  embedding: number[]; // 1536 dimensions for OpenAI, 1024 for others
  createdAt: string;
}

// ============================================================================
// Usage Tracking Types
// ============================================================================

export interface AIChatUsage {
  id: string;
  companyId: string;
  userId: string;
  questionCount: number;
  tokenCount: number;
  periodStart: string; // Start of billing period (month)
  periodEnd: string;
  lastQuestionAt: string;
}

export interface UsageLimits {
  questionsPerMonth: number;
  tokensPerMonth: number;
  questionsRemaining: number;
  tokensRemaining: number;
  resetsAt: string;
}

// ============================================================================
// UI State Types
// ============================================================================

export interface CFOChatState {
  isOpen: boolean;
  isLoading: boolean;
  messages: ChatMessage[];
  error: CFOChatError | null;
  usageLimits: UsageLimits | null;
}

export interface SuggestedQuestion {
  text: string;
  category: 'general' | 'job-specific' | 'weekly-review' | 'troubleshooting';
  /** Optional job context if this is a job-specific question */
  jobId?: string;
}

// ============================================================================
// Coach Martin Persona
// ============================================================================

export const COACH_MARTIN = {
  name: 'Coach Martin',
  title: 'AI CFO',
  tagline: '30 Years of CFO Experience',
  avatarUrl: '/images/ai-coach/coach.png',
  disclaimer: 'Educational guidance only. Verify with your CPA/legal counsel before relying on this for reporting, tax, or contract decisions.',
} as const;
