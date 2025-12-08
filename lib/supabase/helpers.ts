import { Job, Note, JobStatus, JobType, TMSettings, MobilizationPhase, Settings, CompanyType, ManagedCompany, ModuleId, JobCategory, ProductType, JobComplexity, IndustryType, RevenueRange, EmployeeRange, ServicePreference, JobFinancialSnapshot, BillingPositionLabel } from '../../types';

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
    asOfDate: dbJob.as_of_date || undefined,
    companyId: dbJob.company_id || undefined,
    jobType: (dbJob.job_type as JobType) || 'fixed-price',
    tmSettings,
    mobilizations,
    laborCostPerHour: dbJob.labor_cost_per_hour ? Number(dbJob.labor_cost_per_hour) : undefined,

    // Job Classification
    jobCategory: dbJob.job_category as JobCategory || undefined,
    productType: dbJob.product_type as ProductType || undefined,
    jobComplexity: dbJob.job_complexity ? (Number(dbJob.job_complexity) as JobComplexity) : undefined,
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
    as_of_date: job.asOfDate || null,
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

    // Job Classification
    job_category: job.jobCategory || null,
    product_type: job.productType || null,
    job_complexity: job.jobComplexity || null,
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

// Transform Supabase settings row to app Settings type (with managed company fields)
export function dbSettingsToAppSettings(dbSettings: any): Settings {
  return {
    companyName: dbSettings.company_name || '',
    projectManagers: dbSettings.project_managers || [],
    estimators: dbSettings.estimators || [],
    weekEndDay: dbSettings.week_end_day || 'Friday',
    defaultStatus: dbSettings.default_status || 'Active',
    companyLogo: dbSettings.company_logo || undefined,
    defaultRole: dbSettings.default_role || 'owner',
    capacityEnabled: dbSettings.capacity_enabled || false,
    capacityPlan: dbSettings.capacity_plan || null,
    companyId: dbSettings.company_id || undefined,

    // Onboarding fields
    industry: dbSettings.industry as IndustryType || undefined,
    annualRevenueRange: dbSettings.annual_revenue_range as RevenueRange || undefined,
    employeeCountRange: dbSettings.employee_count_range as EmployeeRange || undefined,
    interestedModules: dbSettings.interested_modules || undefined,
    servicePreference: dbSettings.service_preference as ServicePreference || undefined,

    // Company classification
    companyType: (dbSettings.company_type as CompanyType) || 'direct',

    // Managed company fields
    managedByCfoUserId: dbSettings.managed_by_cfo_user_id || undefined,
    managedByCfoCompanyId: dbSettings.managed_by_cfo_company_id || undefined,
    managedByPracticeName: dbSettings.managed_by_practice_name || undefined,
    grantedModules: dbSettings.granted_modules || undefined,

    // Subscription fields
    subscriptionTier: dbSettings.subscription_tier || undefined,
    enabledModules: dbSettings.enabled_modules || undefined,
    subscriptionExpiresAt: dbSettings.subscription_expires_at || undefined,
  };
}

// Transform app Settings to Supabase update format
export function appSettingsToDbSettings(settings: Partial<Settings>): any {
  const dbSettings: any = {};

  if (settings.companyName !== undefined) dbSettings.company_name = settings.companyName;
  if (settings.projectManagers !== undefined) dbSettings.project_managers = settings.projectManagers;
  if (settings.estimators !== undefined) dbSettings.estimators = settings.estimators;
  if (settings.weekEndDay !== undefined) dbSettings.week_end_day = settings.weekEndDay;
  if (settings.defaultStatus !== undefined) dbSettings.default_status = settings.defaultStatus;
  if (settings.companyLogo !== undefined) dbSettings.company_logo = settings.companyLogo;
  if (settings.defaultRole !== undefined) dbSettings.default_role = settings.defaultRole;
  if (settings.capacityEnabled !== undefined) dbSettings.capacity_enabled = settings.capacityEnabled;
  if (settings.capacityPlan !== undefined) dbSettings.capacity_plan = settings.capacityPlan;

  // Onboarding fields
  if (settings.industry !== undefined) dbSettings.industry = settings.industry;
  if (settings.annualRevenueRange !== undefined) dbSettings.annual_revenue_range = settings.annualRevenueRange;
  if (settings.employeeCountRange !== undefined) dbSettings.employee_count_range = settings.employeeCountRange;
  if (settings.interestedModules !== undefined) dbSettings.interested_modules = settings.interestedModules;
  if (settings.servicePreference !== undefined) dbSettings.service_preference = settings.servicePreference;

  // Company classification
  if (settings.companyType !== undefined) dbSettings.company_type = settings.companyType;

  // Managed company fields
  if (settings.managedByCfoUserId !== undefined) dbSettings.managed_by_cfo_user_id = settings.managedByCfoUserId;
  if (settings.managedByCfoCompanyId !== undefined) dbSettings.managed_by_cfo_company_id = settings.managedByCfoCompanyId;
  if (settings.managedByPracticeName !== undefined) dbSettings.managed_by_practice_name = settings.managedByPracticeName;
  if (settings.grantedModules !== undefined) dbSettings.granted_modules = settings.grantedModules;

  // Subscription fields
  if (settings.subscriptionTier !== undefined) dbSettings.subscription_tier = settings.subscriptionTier;
  if (settings.enabledModules !== undefined) dbSettings.enabled_modules = settings.enabledModules;
  if (settings.subscriptionExpiresAt !== undefined) dbSettings.subscription_expires_at = settings.subscriptionExpiresAt;

  return dbSettings;
}

// Transform Supabase managed company row to app ManagedCompany type
export function dbManagedCompanyToApp(dbCompany: any): ManagedCompany {
  return {
    id: dbCompany.company_id,
    name: dbCompany.company_name,
    companyType: dbCompany.company_type || 'managed',
    grantedModules: dbCompany.granted_modules || [],
    createdAt: dbCompany.created_at,
  };
}

// ============================================================================
// Job Financial Snapshot Transforms
// ============================================================================


// Transform Supabase job_financial_snapshots row to app JobFinancialSnapshot type
export function dbSnapshotToAppSnapshot(dbSnapshot: any): JobFinancialSnapshot {
  return {
    id: dbSnapshot.id,
    companyId: dbSnapshot.company_id,
    jobId: dbSnapshot.job_id,
    snapshotDate: dbSnapshot.snapshot_date,
    createdAt: dbSnapshot.created_at,
    // Contract/Budget
    contractAmount: Number(dbSnapshot.contract_amount) || 0,
    originalBudgetTotal: Number(dbSnapshot.original_budget_total) || 0,
    originalProfitTarget: Number(dbSnapshot.original_profit_target) || 0,
    originalMarginTarget: Number(dbSnapshot.original_margin_target) || 0,
    // Actuals
    earnedToDate: Number(dbSnapshot.earned_to_date) || 0,
    invoicedToDate: Number(dbSnapshot.invoiced_to_date) || 0,
    costLaborToDate: Number(dbSnapshot.cost_labor_to_date) || 0,
    costMaterialToDate: Number(dbSnapshot.cost_material_to_date) || 0,
    costOtherToDate: Number(dbSnapshot.cost_other_to_date) || 0,
    totalCostToDate: Number(dbSnapshot.total_cost_to_date) || 0,
    // Forecasts
    forecastedCostFinal: dbSnapshot.forecasted_cost_final ? Number(dbSnapshot.forecasted_cost_final) : null,
    forecastedRevenueFinal: dbSnapshot.forecasted_revenue_final ? Number(dbSnapshot.forecasted_revenue_final) : null,
    forecastedProfitFinal: dbSnapshot.forecasted_profit_final ? Number(dbSnapshot.forecasted_profit_final) : null,
    forecastedMarginFinal: dbSnapshot.forecasted_margin_final ? Number(dbSnapshot.forecasted_margin_final) : null,
    // Billing
    billingPositionNumeric: dbSnapshot.billing_position_numeric ? Number(dbSnapshot.billing_position_numeric) : null,
    billingPositionLabel: dbSnapshot.billing_position_label as BillingPositionLabel | null,
    // Health
    atRiskMargin: dbSnapshot.at_risk_margin || false,
    behindSchedule: dbSnapshot.behind_schedule || false,
  };
}

// Transform app JobFinancialSnapshot to Supabase insert format
export function appSnapshotToDbSnapshot(snapshot: Omit<JobFinancialSnapshot, 'id' | 'createdAt'>): any {
  return {
    company_id: snapshot.companyId,
    job_id: snapshot.jobId,
    snapshot_date: snapshot.snapshotDate,
    // Contract/Budget
    contract_amount: snapshot.contractAmount,
    original_budget_total: snapshot.originalBudgetTotal,
    original_profit_target: snapshot.originalProfitTarget,
    original_margin_target: snapshot.originalMarginTarget,
    // Actuals
    earned_to_date: snapshot.earnedToDate,
    invoiced_to_date: snapshot.invoicedToDate,
    cost_labor_to_date: snapshot.costLaborToDate,
    cost_material_to_date: snapshot.costMaterialToDate,
    cost_other_to_date: snapshot.costOtherToDate,
    total_cost_to_date: snapshot.totalCostToDate,
    // Forecasts
    forecasted_cost_final: snapshot.forecastedCostFinal,
    forecasted_revenue_final: snapshot.forecastedRevenueFinal,
    forecasted_profit_final: snapshot.forecastedProfitFinal,
    forecasted_margin_final: snapshot.forecastedMarginFinal,
    // Billing
    billing_position_numeric: snapshot.billingPositionNumeric,
    billing_position_label: snapshot.billingPositionLabel,
    // Health
    at_risk_margin: snapshot.atRiskMargin,
    behind_schedule: snapshot.behindSchedule,
  };
}

