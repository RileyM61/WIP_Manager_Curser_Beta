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
}

export type ViewMode = 'grid' | 'table';

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