export enum JobStatus {
  Future = 'Future',
  Active = 'Active',
  OnHold = 'On Hold',
  Completed = 'Completed',
  Archived = 'Archived',
}

export interface CostBreakdown {
  labor: number;
  material: number;
  other: number;
}

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

export interface MobilizationPhase {
  id: number;                  // 1-4 for the four possible phases
  enabled: boolean;            // Whether this phase is active
  mobilizeDate: string;        // Date work begins for this phase
  demobilizeDate: string;      // Date work ends for this phase
  description?: string;        // Optional description (e.g., "Foundation", "Framing")
}

export interface Note {
  id: string;
  text: string;
  date: string;
}

export interface Job {
  id:string;
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
  targetProfit?: number;
  targetMargin?: number;
  targetEndDate?: string;
  companyId?: string;
  estimator?: string;
  jobType: JobType;
  tmSettings?: TMSettings;
  mobilizations?: MobilizationPhase[];  // Up to 4 mobilization/demobilization phases
}

export type ViewMode = 'grid' | 'table' | 'gantt';

export type SortKey = 'jobName' | 'startDate' | 'jobNo';

export type SortDirection = 'asc' | 'desc';

export type FilterType = JobStatus | 'company' | 'forecast';

export type WeekDay = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export type UserRole = 'owner' | 'projectManager' | 'estimator';

export enum StaffingDiscipline {
  ProjectManagement = 'Project Management',
  Superintendents = 'Superintendents',
  Engineering = 'Engineering',
  FieldLabor = 'Field Labor',
  Safety = 'Safety'
}

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
}

export interface JobsSnapshot {
  timestamp: string;
  jobs: Job[];
}

export interface Company {
  id: string;
  name: string;
  createdAt?: string;
}

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