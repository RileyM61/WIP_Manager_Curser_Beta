/**
 * Core Application Types
 * 
 * This file contains all shared types used across the AI CFO Suite platform.
 * Module-specific types should be placed in their respective module folders.
 */

// Re-export module system types
export * from './modules';

// ============================================================================
// Job Status & Enums
// ============================================================================

export enum JobStatus {
  Draft = 'Draft',
  Future = 'Future',
  Active = 'Active',
  OnHold = 'On Hold',
  Completed = 'Completed',
  Archived = 'Archived',
}

// Job Classification Types (for AI Post-Mortem Analysis)
export type JobCategory = 'Commercial' | 'Government' | 'Residential';

export type ProductType = 'Chain Link' | 'Ornamental' | 'Field Fencing' | 'Vinyl' | 'Wood' | 'Other';

export type JobComplexity = 1 | 2 | 3 | 4 | 5;

// ============================================================================
// Financial Types
// ============================================================================

export interface CostBreakdown {
  labor: number;
  material: number;
  other: number;
}

export type FinanceField = 'invoiced' | 'costs' | 'costToComplete';

export type InlineFinanceUpdate =
  | { type: 'total'; field: FinanceField; value: number }
  | { type: 'component'; field: FinanceField; key: keyof CostBreakdown; value: number }
  | { type: 'date'; value: string };

export type JobType = 'fixed-price' | 'time-material';

export type LaborBillingType = 'fixed-rate' | 'markup';

export interface TMSettings {
  laborBillingType: LaborBillingType;
  laborBillRate?: number;      // $/hour when laborBillingType = 'fixed-rate'
  laborHours?: number;         // Total hours worked (needed for fixed-rate calculation)
  laborMarkup?: number;        // e.g., 1.5 = 50% markup when laborBillingType = 'markup'
  materialMarkup: number;      // e.g., 1.15 = 15% markup
  otherMarkup: number;         // e.g., 1.10 = 10% markup
}

// ============================================================================
// Change Orders
// ============================================================================

export type ChangeOrderStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface ChangeOrder {
  id: string;
  jobId: string;
  companyId?: string;
  coNumber: number;              // Sequential per job (1, 2, 3...)
  description: string;
  coType: JobType;               // Can be fixed-price or time-material (independent of parent job)
  status: ChangeOrderStatus;

  // Financial breakdowns (same structure as Job)
  contract: CostBreakdown;
  budget: CostBreakdown;
  costs: CostBreakdown;
  invoiced: CostBreakdown;
  costToComplete: CostBreakdown;

  // T&M settings (for T&M COs only)
  tmSettings?: TMSettings;

  // Tracking dates
  submittedDate?: string;
  approvedDate?: string;
  completedDate?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

// ============================================================================
// Scheduling Types
// ============================================================================


export interface MobilizationPhase {
  id: number;                  // 1-4 for the four possible phases
  enabled: boolean;            // Whether this phase is active
  mobilizeDate: string;        // Date work begins for this phase
  demobilizeDate: string;      // Date work ends for this phase
  description?: string;        // Optional description (e.g., "Foundation", "Framing")
}

// ============================================================================
// Job & Notes
// ============================================================================

export interface Note {
  id: string;
  text: string;
  date: string;
}

export interface Job {
  id: string;
  jobNo: string;
  jobName: string;
  client: string;
  projectManager: string;
  startDate: string;
  endDate: string;
  contract: CostBreakdown;
  invoiced: CostBreakdown;
  costs: CostBreakdown;
  budget: CostBreakdown;
  costToComplete: CostBreakdown;
  status: JobStatus;
  notes?: Note[];
  onHoldDate?: string;
  lastUpdated?: string;
  asOfDate?: string;  // Date the financial data represents (for period-accurate reporting)
  targetProfit?: number;
  targetMargin?: number;
  targetEndDate?: string;
  companyId?: string;
  estimator?: string;
  jobType: JobType;
  tmSettings?: TMSettings;
  mobilizations?: MobilizationPhase[];  // Up to 4 mobilization/demobilization phases
  laborCostPerHour?: number;  // $/hr rate for converting labor costs to hours

  // Job Classification (for AI Post-Mortem Analysis)
  jobCategory?: JobCategory;    // Commercial, Government, Residential
  productType?: ProductType;    // Chain Link, Ornamental, Field Fencing, Vinyl, Wood, Other
  jobComplexity?: JobComplexity; // 1-5 complexity rating
}

export interface JobsSnapshot {
  timestamp: string;
  jobs: Job[];
}

// ============================================================================
// Job Financial Snapshots (Historical Tracking)
// ============================================================================

export type BillingPositionLabel = 'over-billed' | 'under-billed' | 'on-track';

export interface JobFinancialSnapshot {
  id: string;
  companyId: string;
  jobId: string;
  snapshotDate: string;
  createdAt: string;
  // Contract/Budget
  contractAmount: number;
  originalBudgetTotal: number;
  originalProfitTarget: number;
  originalMarginTarget: number;
  // Actuals
  earnedToDate: number;
  invoicedToDate: number;
  costLaborToDate: number;
  costMaterialToDate: number;
  costOtherToDate: number;
  totalCostToDate: number;
  // Forecasts (EAC)
  forecastedCostFinal: number | null;
  forecastedRevenueFinal: number | null;
  forecastedProfitFinal: number | null;
  forecastedMarginFinal: number | null;
  // Billing/WIP
  billingPositionNumeric: number | null;
  billingPositionLabel: BillingPositionLabel | null;
  // Health Flags
  atRiskMargin: boolean;
  behindSchedule: boolean;
}

// ============================================================================
// View & UI Types
// ============================================================================

export type ViewMode = 'grid' | 'table' | 'gantt' | 'reports';

// Formatting Options (for Appearance settings)
export type DateFormatOption = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
export type NumberFormatOption = 'us' | 'eu';  // US = 1,234.56 | EU = 1.234,56
export type CurrencyLocale = 'USD' | 'EUR' | 'GBP' | 'CAD';

export type SortKey = 'jobName' | 'jobNo' | 'client' | 'projectManager' | 'status' | 'startDate';

export type SortDirection = 'asc' | 'desc';

export type FilterType = JobStatus | 'company' | 'forecast' | 'reports';

export type WeekDay = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

// ============================================================================
// User & Role Types
// ============================================================================

export type UserRole = 'owner' | 'projectManager' | 'estimator';

// ============================================================================
// Capacity Planning Types
// ============================================================================

export enum StaffingDiscipline {
  ProjectManagement = 'Project Management',
  Superintendents = 'Superintendents',
  Engineering = 'Engineering',
  FieldLabor = 'Field Labor',
  Foreman = 'Foreman',
  Shop = 'Shop',
  Safety = 'Safety'
}

// Disciplines that directly perform work on jobs (used for capacity vs workload comparison)
export const PRODUCTIVE_DISCIPLINES: StaffingDiscipline[] = [
  StaffingDiscipline.FieldLabor,
  StaffingDiscipline.Foreman,
  StaffingDiscipline.Engineering,
];

export type CapacityDiscipline = StaffingDiscipline | 'Custom';

export interface CapacityRow {
  id: string;
  discipline: CapacityDiscipline;
  label: string;
  headcount: number;
  hoursPerPerson: number;
  committedHours: number;
}

export interface CapacityPlan {
  planningHorizonWeeks: number;
  rows: CapacityRow[];
  notes?: string;
  lastUpdated?: string;
  companyId?: string;
}

// ============================================================================
// Settings & Company Types
// ============================================================================

import { SubscriptionTier, ModuleId } from './modules';

// Company classification - managed by CFO vs self-service subscriber
export type CompanyType = 'managed' | 'direct';

// Onboarding field types
export type IndustryType = 'Construction' | 'Manufacturing' | 'Professional Services' | 'Retail' | 'Healthcare' | 'Technology' | 'Other';
export type RevenueRange = 'Under $1M' | '$1M-$5M' | '$5M-$10M' | '$10M-$25M' | '$25M-$50M' | '$50M+';
export type EmployeeRange = '1-10' | '11-25' | '26-50' | '51-100' | '100+';
export type ServicePreference = 'self-service' | 'cfo-managed';

export interface Settings {
  companyName: string;
  projectManagers: string[];
  estimators: string[];
  weekEndDay: WeekDay;
  defaultStatus: JobStatus;
  companyLogo?: string;
  defaultRole: UserRole;
  capacityEnabled: boolean;
  capacityPlan?: CapacityPlan | null;
  companyId?: string;

  // Onboarding Information
  industry?: IndustryType;
  annualRevenueRange?: RevenueRange;
  employeeCountRange?: EmployeeRange;
  interestedModules?: ModuleId[];
  servicePreference?: ServicePreference;

  // Company Classification
  companyType: CompanyType;              // 'managed' = CFO client, 'direct' = self-service subscriber

  // For Managed Companies (CFO Clients)
  managedByCfoUserId?: string;           // The CFO's user ID who manages this company
  managedByCfoCompanyId?: string;        // The CFO's company ID
  managedByPracticeName?: string;        // Display name (e.g., "Junction Peak")
  grantedModules?: ModuleId[];           // Modules the CFO has granted to this client

  // For Direct Companies (Self-Service Subscribers)
  subscriptionTier?: SubscriptionTier;
  enabledModules?: ModuleId[];
  subscriptionExpiresAt?: string;

  // Default T&M Markup Settings (for new Time & Material jobs)
  defaultLaborBillRate?: number;     // $/hr for labor billing
  defaultMaterialMarkup?: number;    // Multiplier, e.g., 1.15 = 15% markup
  defaultOtherMarkup?: number;       // Multiplier, e.g., 1.10 = 10% markup

  // Appearance & Formatting
  dateFormat?: DateFormatOption;     // Date display format
  numberFormat?: NumberFormatOption; // Number grouping style (US/EU)
  currencyLocale?: CurrencyLocale;   // Currency symbol & locale
}

export interface Company {
  id: string;
  name: string;
  createdAt?: string;
}

// ============================================================================
// CFO Practice Types (for company switcher)
// ============================================================================

export interface ManagedCompany {
  id: string;
  name: string;
  companyType: CompanyType;
  grantedModules: ModuleId[];
  createdAt?: string;
}

// ============================================================================
// Team & Invitation Types
// ============================================================================

export interface Profile {
  userId: string;
  companyId: string | null;
  role: UserRole;
}

export interface Invitation {
  id: string;
  companyId: string;
  email: string;
  role: UserRole;
  token: string;
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
}

export interface TeamMember {
  userId: string;
  email: string;
  role: UserRole;
  joinedAt: string;
}

