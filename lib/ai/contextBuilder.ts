/**
 * AI Context Builder
 * 
 * Builds contextual information about jobs and company data
 * to inject into AI prompts for more relevant responses.
 * 
 * IMPORTANT: Respects aiDataSharing settings to control what data is shared.
 */

import { Job, JobStatus, Settings, AiDataSharingSettings } from '../../types';

// ============================================================================
// Types
// ============================================================================

export interface JobSummary {
  jobNo: string;
  jobName: string;
  client?: string; // Only if includeClientIdentifiers
  status: JobStatus;
  projectManager: string;
  // Financial summary (if includeJobFinancialTotals)
  contractTotal?: number;
  costToDate?: number;
  invoicedToDate?: number;
  billingPosition?: 'overbilled' | 'underbilled' | 'on-track';
  billingAmount?: number;
  profitVariance?: number;
  // Detailed breakdown (if includeCostBreakdownDetail)
  costBreakdown?: {
    labor: number;
    material: number;
    other: number;
  };
}

export interface CompanyContext {
  companyName?: string;
  totalActiveJobs: number;
  totalUnderbilled: number;
  totalOverbilled: number;
  jobsNeedingAttention: number;
}

export interface AIContext {
  company?: CompanyContext;
  selectedJob?: JobSummary;
  relatedJobs?: JobSummary[];
  currentView: string;
  userRole: 'owner' | 'projectManager' | 'estimator';
}

// ============================================================================
// Helper Functions
// ============================================================================

const sumBreakdown = (breakdown: { labor: number; material: number; other: number }): number =>
  breakdown.labor + breakdown.material + breakdown.other;

const calculateBillingPosition = (job: Job): { position: 'overbilled' | 'underbilled' | 'on-track'; amount: number } => {
  const totalContract = sumBreakdown(job.contract);
  const totalCosts = sumBreakdown(job.costs);
  const totalInvoiced = sumBreakdown(job.invoiced);
  
  if (totalContract === 0) return { position: 'on-track', amount: 0 };
  
  const percentComplete = totalCosts / (totalCosts + sumBreakdown(job.costToComplete));
  const earnedRevenue = totalContract * percentComplete;
  const billingDiff = totalInvoiced - earnedRevenue;
  
  if (billingDiff > totalContract * 0.02) {
    return { position: 'overbilled', amount: billingDiff };
  } else if (billingDiff < -totalContract * 0.02) {
    return { position: 'underbilled', amount: Math.abs(billingDiff) };
  }
  return { position: 'on-track', amount: 0 };
};

// ============================================================================
// Main Context Builder
// ============================================================================

/**
 * Build a job summary respecting data sharing settings
 */
export function buildJobSummary(
  job: Job,
  dataSharing: AiDataSharingSettings | undefined
): JobSummary {
  const summary: JobSummary = {
    jobNo: job.jobNo,
    jobName: job.jobName,
    status: job.status,
    projectManager: job.projectManager,
  };

  // Include client only if allowed
  if (dataSharing?.includeClientIdentifiers) {
    summary.client = job.client;
  }

  // Include financial totals if allowed
  if (dataSharing?.includeJobFinancialTotals !== false) {
    summary.contractTotal = sumBreakdown(job.contract);
    summary.costToDate = sumBreakdown(job.costs);
    summary.invoicedToDate = sumBreakdown(job.invoiced);
    
    const billing = calculateBillingPosition(job);
    summary.billingPosition = billing.position;
    summary.billingAmount = billing.amount;
    
    // Calculate profit variance
    const originalProfit = job.targetProfit ?? (summary.contractTotal - sumBreakdown(job.budget));
    const forecastProfit = summary.contractTotal - (summary.costToDate + sumBreakdown(job.costToComplete));
    summary.profitVariance = forecastProfit - originalProfit;
  }

  // Include cost breakdown detail if allowed
  if (dataSharing?.includeCostBreakdownDetail) {
    summary.costBreakdown = {
      labor: job.costs.labor,
      material: job.costs.material,
      other: job.costs.other,
    };
  }

  return summary;
}

/**
 * Build company-wide context
 */
export function buildCompanyContext(
  jobs: Job[],
  settings: Settings,
  dataSharing: AiDataSharingSettings | undefined
): CompanyContext {
  const activeJobs = jobs.filter(j => j.status === JobStatus.Active);
  
  let totalUnderbilled = 0;
  let totalOverbilled = 0;
  let jobsNeedingAttention = 0;

  activeJobs.forEach(job => {
    const billing = calculateBillingPosition(job);
    if (billing.position === 'underbilled') {
      totalUnderbilled += billing.amount;
      // Flag as needing attention if significantly underbilled (>10% of contract)
      const contractTotal = sumBreakdown(job.contract);
      if (billing.amount > contractTotal * 0.1) {
        jobsNeedingAttention++;
      }
    } else if (billing.position === 'overbilled') {
      totalOverbilled += billing.amount;
    }
  });

  return {
    companyName: dataSharing?.includeClientIdentifiers !== false ? settings.companyName : undefined,
    totalActiveJobs: activeJobs.length,
    totalUnderbilled,
    totalOverbilled,
    jobsNeedingAttention,
  };
}

/**
 * Build full AI context for a chat request
 */
export function buildAIContext(options: {
  jobs: Job[];
  settings: Settings;
  selectedJobId?: string;
  currentView: string;
  userRole: 'owner' | 'projectManager' | 'estimator';
  pmFilter?: string;
}): AIContext {
  const { jobs, settings, selectedJobId, currentView, userRole, pmFilter } = options;
  const dataSharing = settings.aiDataSharing;

  const context: AIContext = {
    currentView,
    userRole,
  };

  // Add company context for owners
  if (userRole === 'owner') {
    context.company = buildCompanyContext(jobs, settings, dataSharing);
  }

  // Add selected job context
  if (selectedJobId) {
    const selectedJob = jobs.find(j => j.id === selectedJobId);
    if (selectedJob) {
      context.selectedJob = buildJobSummary(selectedJob, dataSharing);
    }
  }

  // Add related jobs (for PM, show their jobs; for owner, show troubled jobs)
  const relevantJobs = jobs
    .filter(j => {
      if (j.status !== JobStatus.Active) return false;
      if (userRole === 'projectManager' && pmFilter) {
        return j.projectManager === pmFilter;
      }
      return true;
    })
    .slice(0, 5); // Limit to avoid token bloat

  if (relevantJobs.length > 0 && !selectedJobId) {
    context.relatedJobs = relevantJobs.map(j => buildJobSummary(j, dataSharing));
  }

  return context;
}

/**
 * Convert AI context to a human-readable string for the prompt
 */
export function contextToPromptString(context: AIContext): string {
  const lines: string[] = [];

  lines.push(`## User Context`);
  lines.push(`- Role: ${context.userRole}`);
  lines.push(`- Current View: ${context.currentView}`);

  if (context.company) {
    lines.push(`\n## Company Overview`);
    if (context.company.companyName) {
      lines.push(`- Company: ${context.company.companyName}`);
    }
    lines.push(`- Active Jobs: ${context.company.totalActiveJobs}`);
    lines.push(`- Total Underbilled: $${context.company.totalUnderbilled.toLocaleString()}`);
    lines.push(`- Total Overbilled: $${context.company.totalOverbilled.toLocaleString()}`);
    lines.push(`- Jobs Needing Attention: ${context.company.jobsNeedingAttention}`);
  }

  if (context.selectedJob) {
    lines.push(`\n## Selected Job: ${context.selectedJob.jobNo} - ${context.selectedJob.jobName}`);
    lines.push(`- Status: ${context.selectedJob.status}`);
    lines.push(`- Project Manager: ${context.selectedJob.projectManager}`);
    if (context.selectedJob.client) {
      lines.push(`- Client: ${context.selectedJob.client}`);
    }
    if (context.selectedJob.contractTotal !== undefined) {
      lines.push(`- Contract: $${context.selectedJob.contractTotal.toLocaleString()}`);
      lines.push(`- Cost to Date: $${context.selectedJob.costToDate?.toLocaleString()}`);
      lines.push(`- Invoiced: $${context.selectedJob.invoicedToDate?.toLocaleString()}`);
      lines.push(`- Billing Position: ${context.selectedJob.billingPosition} ($${context.selectedJob.billingAmount?.toLocaleString()})`);
      if (context.selectedJob.profitVariance !== undefined) {
        const sign = context.selectedJob.profitVariance >= 0 ? '+' : '';
        lines.push(`- Profit Variance: ${sign}$${context.selectedJob.profitVariance.toLocaleString()}`);
      }
    }
  }

  if (context.relatedJobs && context.relatedJobs.length > 0) {
    lines.push(`\n## Other Active Jobs (Summary)`);
    context.relatedJobs.forEach(job => {
      let jobLine = `- ${job.jobNo}: ${job.jobName} (${job.status})`;
      if (job.billingPosition && job.billingPosition !== 'on-track') {
        jobLine += ` - ${job.billingPosition} $${job.billingAmount?.toLocaleString()}`;
      }
      lines.push(jobLine);
    });
  }

  return lines.join('\n');
}
