/**
 * AI CFO Library
 * 
 * Core utilities for the Coach Martin AI assistant.
 */

export { SYSTEM_PROMPT, getSystemPrompt, SUGGESTED_QUESTION_TEMPLATES } from './systemPrompt';
export {
  buildJobSummary,
  buildCompanyContext,
  buildAIContext,
  contextToPromptString,
  type JobSummary,
  type CompanyContext,
  type AIContext,
} from './contextBuilder';
