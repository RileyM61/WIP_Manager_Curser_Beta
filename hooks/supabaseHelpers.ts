import { Job, Note, CostBreakdown, JobStatus } from '../types';

// Transform Supabase job row to app Job type
export function dbJobToAppJob(dbJob: any): Job {
  return {
    id: dbJob.id,
    jobNo: dbJob.job_no,
    jobName: dbJob.job_name,
    client: dbJob.client,
    projectManager: dbJob.project_manager,
    status: dbJob.status as JobStatus,
    startDate: dbJob.start_date ? dbJob.start_date : 'TBD',
    endDate: dbJob.end_date ? dbJob.end_date : 'TBD',
    targetEndDate: dbJob.target_end_date ? dbJob.target_end_date : 'TBD',
    contract: {
      labor: Number(dbJob.contract_labor),
      material: Number(dbJob.contract_material),
      other: Number(dbJob.contract_other),
    },
    invoiced: {
      labor: Number(dbJob.invoiced_labor),
      material: Number(dbJob.invoiced_material),
      other: Number(dbJob.invoiced_other),
    },
    budget: {
      labor: Number(dbJob.budget_labor),
      material: Number(dbJob.budget_material),
      other: Number(dbJob.budget_other),
    },
    costs: {
      labor: Number(dbJob.cost_labor),
      material: Number(dbJob.cost_material),
      other: Number(dbJob.cost_other),
    },
    costToComplete: {
      labor: Number(dbJob.cost_to_complete_labor),
      material: Number(dbJob.cost_to_complete_material),
      other: Number(dbJob.cost_to_complete_other),
    },
    targetProfit: dbJob.target_profit ? Number(dbJob.target_profit) : undefined,
    targetMargin: dbJob.target_margin ? Number(dbJob.target_margin) : undefined,
    onHoldDate: dbJob.on_hold_date || undefined,
    lastUpdated: dbJob.last_updated,
    companyId: dbJob.company_id || undefined,
  };
}

// Transform app Job to Supabase insert/update format
export function appJobToDbJob(job: Job): any {
  return {
    job_no: job.jobNo,
    job_name: job.jobName,
    client: job.client,
    project_manager: job.projectManager,
    status: job.status,
    start_date: job.startDate === 'TBD' ? null : job.startDate,
    end_date: job.endDate === 'TBD' ? null : job.endDate,
    target_end_date: job.targetEndDate === 'TBD' ? null : job.targetEndDate,
    contract_labor: job.contract.labor,
    contract_material: job.contract.material,
    contract_other: job.contract.other,
    invoiced_labor: job.invoiced.labor,
    invoiced_material: job.invoiced.material,
    invoiced_other: job.invoiced.other,
    budget_labor: job.budget.labor,
    budget_material: job.budget.material,
    budget_other: job.budget.other,
    cost_labor: job.costs.labor,
    cost_material: job.costs.material,
    cost_other: job.costs.other,
    cost_to_complete_labor: job.costToComplete.labor,
    cost_to_complete_material: job.costToComplete.material,
    cost_to_complete_other: job.costToComplete.other,
    target_profit: job.targetProfit || null,
    target_margin: job.targetMargin || null,
    on_hold_date: job.onHoldDate || null,
    company_id: job.companyId || null,
  };
}

// Transform Supabase note to app Note type
export function dbNoteToAppNote(dbNote: any): Note {
  return {
    id: dbNote.id,
    text: dbNote.body,
    date: dbNote.created_at,
  };
}

