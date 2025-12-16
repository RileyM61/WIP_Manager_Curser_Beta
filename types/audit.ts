/**
 * Audit Trail / Activity Log Types
 */

export type AuditEntityType = 'job' | 'change_order';
export type AuditAction = 'create' | 'update' | 'delete';

/**
 * A single field change within an audit entry
 */
export interface AuditFieldChange {
  field: string;          // Database column name (e.g., 'cost_labor')
  label: string;          // Human-readable label (e.g., 'Labor Cost')
  old: any;               // Previous value
  new: any;               // New value
}

/**
 * An audit log entry representing a change to a job or change order
 */
export interface AuditLogEntry {
  id: string;
  companyId: string;
  entityType: AuditEntityType;
  entityId: string;
  entityName: string;     // Display name: "Job #123 - Project Name" or "Job #123 - CO #1"
  action: AuditAction;
  changedBy: string | null;
  changedByEmail: string | null;
  changedAt: string;      // ISO timestamp
  changes: AuditFieldChange[];
  createdAt: string;      // ISO timestamp
}

/**
 * Field label mappings for display
 * Maps database column names to human-readable labels
 */
export const AUDIT_FIELD_LABELS: Record<string, string> = {
  // Job basic fields
  job_no: 'Job Number',
  job_name: 'Job Name',
  client: 'Client',
  project_manager: 'Project Manager',
  estimator: 'Estimator',
  status: 'Status',
  start_date: 'Start Date',
  end_date: 'End Date',
  target_end_date: 'Target End Date',
  
  // Job financial - Contract
  contract_labor: 'Contract Labor',
  contract_material: 'Contract Material',
  contract_other: 'Contract Other',
  
  // Job financial - Budget
  budget_labor: 'Budget Labor',
  budget_material: 'Budget Material',
  budget_other: 'Budget Other',
  
  // Job financial - Costs
  cost_labor: 'Labor Costs',
  cost_material: 'Material Costs',
  cost_other: 'Other Costs',
  
  // Job financial - Invoiced
  invoiced_labor: 'Invoiced Labor',
  invoiced_material: 'Invoiced Material',
  invoiced_other: 'Invoiced Other',
  
  // Job financial - Cost to Complete
  cost_to_complete_labor: 'Cost to Complete Labor',
  cost_to_complete_material: 'Cost to Complete Material',
  cost_to_complete_other: 'Cost to Complete Other',
  
  // Job other
  target_profit: 'Target Profit',
  target_margin: 'Target Margin',
  job_type: 'Job Type',
  labor_cost_per_hour: 'Labor Cost Per Hour',
  job_category: 'Job Category',
  product_type: 'Product Type',
  job_complexity: 'Job Complexity',
  
  // Change Order fields
  co_number: 'CO Number',
  description: 'Description',
  co_type: 'CO Type',
  submitted_date: 'Submitted Date',
  approved_date: 'Approved Date',
  completed_date: 'Completed Date',
  
  // Change Order financial fields use same names as jobs
  // (contract_labor, budget_labor, etc.)
};

/**
 * Filter options for audit log queries
 */
export interface AuditLogFilters {
  entityType?: AuditEntityType | null;
  entityId?: string | null;
  action?: AuditAction | null;
  changedBy?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  searchQuery?: string | null;
}

