/**
 * Value Builder Module Types
 */

// Financial inputs for a valuation
export interface ValuationInputs {
  annualRevenue: number;
  netProfit: number;
  ownerCompensation: number;
  depreciation: number;
  interestExpense: number;
  taxes: number;
  otherAddbacks: number;
  multiple: number;
}

// Complete valuation record
export interface Valuation extends ValuationInputs {
  id: string;
  companyId: string;
  name: string;
  isCurrent: boolean;
  adjustedEbitda: number;
  businessValue: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// Value history record for trending
export interface ValueHistoryRecord {
  id: string;
  companyId: string;
  valuationId: string | null;
  recordedAt: string;
  adjustedEbitda: number;
  multiple: number;
  businessValue: number;
  createdAt: string;
}

// Form data for creating/editing valuations
export interface ValuationFormData {
  name: string;
  annualRevenue: number;
  netProfit: number;
  ownerCompensation: number;
  depreciation: number;
  interestExpense: number;
  taxes: number;
  otherAddbacks: number;
  multiple: number;
  notes: string;
  isCurrent: boolean;
}

// Calculated results
export interface ValuationResults {
  adjustedEbitda: number;
  businessValue: number;
  ebitdaMargin: number;
  valueToRevenue: number;
}

// Comparison data for side-by-side view
export interface ScenarioComparison {
  scenarios: Valuation[];
  differences: {
    field: string;
    values: number[];
    delta: number;
    percentChange: number;
  }[];
}

// Dashboard summary
export interface ValueSummary {
  currentValue: number;
  currentEbitda: number;
  currentMultiple: number;
  scenarioCount: number;
  lastUpdated: string | null;
  valueChange: {
    amount: number;
    percent: number;
    period: string;
  } | null;
}

// Value Driver Assessment Types
import { QuestionnaireAnswers, ValueDriverScore, ValueDriverCategory } from './lib/questionnaire';

export interface ValueDriverAssessment {
  id: string;
  companyId: string;
  valuationId: string | null; // Link to specific valuation if applicable
  answers: QuestionnaireAnswers;
  scores: ValueDriverScore[];
  overallScore: number; // Aggregate score (-2 to +2)
  strengths: ValueDriverCategory[]; // Top 3 categories
  weaknesses: ValueDriverCategory[]; // Bottom 3 categories
  recommendations: StrategicRecommendation[]; // Generated recommendations
  completedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface StrategicRecommendation {
  category: ValueDriverCategory;
  priority: 'high' | 'medium' | 'low';
  currentScore: number;
  targetScore: number;
  potentialValueImpact: number; // Estimated multiple increase if addressed
  actionItems: string[];
  estimatedCost: number | null;
  estimatedTimeline: string;
  roi: number | null; // Return on investment (value increase / cost)
}

