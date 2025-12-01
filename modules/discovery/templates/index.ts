/**
 * Interview Templates Index
 * 
 * Exports all interview templates for easy access.
 */

import { InterviewTemplate, InterviewRole } from '../types';
import { CEO_INTERVIEW_TEMPLATE } from './ceo-template';
import { CONTROLLER_INTERVIEW_TEMPLATE } from './controller-template';
import { OPERATIONS_INTERVIEW_TEMPLATE } from './operations-template';
import { SALES_INTERVIEW_TEMPLATE } from './sales-template';

// Export individual templates
export { CEO_INTERVIEW_TEMPLATE } from './ceo-template';
export { CONTROLLER_INTERVIEW_TEMPLATE } from './controller-template';
export { OPERATIONS_INTERVIEW_TEMPLATE } from './operations-template';
export { SALES_INTERVIEW_TEMPLATE } from './sales-template';

// All templates by role
export const INTERVIEW_TEMPLATES: Record<InterviewRole, InterviewTemplate> = {
  ceo: CEO_INTERVIEW_TEMPLATE,
  controller: CONTROLLER_INTERVIEW_TEMPLATE,
  operations: OPERATIONS_INTERVIEW_TEMPLATE,
  sales: SALES_INTERVIEW_TEMPLATE,
};

// Get template by ID
export function getTemplateById(templateId: string): InterviewTemplate | undefined {
  return Object.values(INTERVIEW_TEMPLATES).find(t => t.id === templateId);
}

// Get template by role
export function getTemplateByRole(role: InterviewRole): InterviewTemplate {
  return INTERVIEW_TEMPLATES[role];
}

// Get all templates as array
export function getAllTemplates(): InterviewTemplate[] {
  return Object.values(INTERVIEW_TEMPLATES);
}

// Get total question count for a template
export function getTemplateQuestionCount(template: InterviewTemplate): number {
  return template.sections.reduce((total, section) => total + section.questions.length, 0);
}

// Get required question count for a template
export function getRequiredQuestionCount(template: InterviewTemplate): number {
  return template.sections.reduce(
    (total, section) => total + section.questions.filter(q => q.required).length,
    0
  );
}

// Calculate estimated time for all interviews
export function getTotalEstimatedTime(): number {
  return Object.values(INTERVIEW_TEMPLATES).reduce((total, t) => total + t.estimatedMinutes, 0);
}

