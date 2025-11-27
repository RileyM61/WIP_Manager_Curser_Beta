import { Job, Note, JobStatus, JobType, TMSettings, MobilizationPhase } from '../../types';

// Transform Supabase job row to app Job type
export function dbJobToAppJob(dbJob: any): Job {
  // Parse tm_settings from JSONB
  let tmSettings: TMSettings | undefined;
  if (dbJob.tm_settings) {
    const tm = typeof dbJob.tm_settings === 'string' 
      ? JSON.parse(dbJob.tm_settings) 
      : dbJob.tm_settings;
    tmSettings = {
      laborBillingType: tm.laborBillingType || 'markup',
      laborBillRate: tm.laborBillRate,
      laborHours: tm.laborHours,
      laborMarkup: tm.laborMarkup,
      materialMarkup: tm.materialMarkup || 1,
      otherMarkup: tm.otherMarkup || 1,
    };
  }

  // Parse mobilizations from JSONB
  let mobilizations: MobilizationPhase[] | undefined;
  if (dbJob.mobilizations) {
    const mobs = typeof dbJob.mobilizations === 'string'
      ? JSON.parse(dbJob.mobilizations)
      : dbJob.mobilizations;
    if (Array.isArray(mobs) && mobs.length > 0) {
      mobilizations = mobs.map((m: any) => ({
        id: m.id,
        enabled: m.enabled,
        mobilizeDate: m.mobilizeDate || 'TBD',
        demobilizeDate: m.demobilizeDate || 'TBD',
        description: m.description || '',
      }));
    }
  }

  return {
    id: dbJob.id,
    jobNo: dbJob.job_no,
    jobName: dbJob.job_name,
    client: dbJob.client,
    projectManager: dbJob.project_manager,
    estimator: dbJob.estimator || undefined,
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
    jobType: (dbJob.job_type as JobType) || 'fixed-price',
    tmSettings,
    mobilizations,
    laborCostPerHour: dbJob.labor_cost_per_hour ? Number(dbJob.labor_cost_per_hour) : undefined,
  };
}

// Transform app Job to Supabase insert/update format
export function appJobToDbJob(job: Job): any {
  // Prepare tm_settings for JSONB storage
  const tmSettings = job.tmSettings ? {
    laborBillingType: job.tmSettings.laborBillingType,
    laborBillRate: job.tmSettings.laborBillRate,
    laborHours: job.tmSettings.laborHours,
    laborMarkup: job.tmSettings.laborMarkup,
    materialMarkup: job.tmSettings.materialMarkup,
    otherMarkup: job.tmSettings.otherMarkup,
  } : null;

  return {
    job_no: job.jobNo,
    job_name: job.jobName,
    client: job.client,
    project_manager: job.projectManager,
    estimator: job.estimator || null,
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
    job_type: job.jobType || 'fixed-price',
    tm_settings: tmSettings,
    mobilizations: job.mobilizations && job.mobilizations.length > 0 
      ? job.mobilizations.map(m => ({
          id: m.id,
          enabled: m.enabled,
          mobilizeDate: m.mobilizeDate,
          demobilizeDate: m.demobilizeDate,
          description: m.description || '',
        }))
      : null,
    labor_cost_per_hour: job.laborCostPerHour || null,
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

