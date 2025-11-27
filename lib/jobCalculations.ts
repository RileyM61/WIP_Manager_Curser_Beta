import { Job, CostBreakdown, MobilizationPhase } from '../types';

/**
 * Sum all components of a cost breakdown
 */
export const sumBreakdown = (breakdown: CostBreakdown): number =>
  breakdown.labor + breakdown.material + breakdown.other;

/**
 * Calculate earned revenue for a job based on its type
 * 
 * Fixed Price: Each component calculated separately:
 *   - Labor Earned = Contract Labor × (Labor Cost / Labor Budget)
 *   - Material Earned = Contract Material × (Material Cost / Material Budget)
 *   - Other Earned = Contract Other × (Other Cost / Other Budget)
 *   - Total = Labor Earned + Material Earned + Other Earned
 * 
 * This component-level approach is more accurate because markups vary between
 * labor, material, and other - using an overall % would skew results when
 * the work mix differs from the original estimate.
 * 
 * Time & Material: Earned = (Labor × markup/rate) + (Material × markup) + (Other × markup)
 */
export const calculateEarnedRevenue = (job: Job): {
  labor: number;
  material: number;
  other: number;
  total: number;
} => {
  if (job.jobType === 'time-material' && job.tmSettings) {
    // T&M calculation
    const tm = job.tmSettings;
    
    // Labor earned depends on billing type
    let laborEarned: number;
    if (tm.laborBillingType === 'fixed-rate') {
      // Fixed rate: Bill Rate × Hours
      laborEarned = (tm.laborBillRate || 0) * (tm.laborHours || 0);
    } else {
      // Markup: Labor Cost × Markup
      laborEarned = job.costs.labor * (tm.laborMarkup || 1);
    }
    
    // Material and Other use markup
    const materialEarned = job.costs.material * (tm.materialMarkup || 1);
    const otherEarned = job.costs.other * (tm.otherMarkup || 1);
    
    return {
      labor: laborEarned,
      material: materialEarned,
      other: otherEarned,
      total: laborEarned + materialEarned + otherEarned,
    };
  } else {
    // Fixed Price calculation - component-level % complete
    // Each component is calculated independently to account for varying markups
    
    // Calculate % complete for each component separately
    const laborPctComplete = job.budget.labor > 0 
      ? job.costs.labor / job.budget.labor 
      : 0;
    const materialPctComplete = job.budget.material > 0 
      ? job.costs.material / job.budget.material 
      : 0;
    const otherPctComplete = job.budget.other > 0 
      ? job.costs.other / job.budget.other 
      : 0;
    
    // Earned revenue for each component = Contract × Component % Complete
    const laborEarned = job.contract.labor * laborPctComplete;
    const materialEarned = job.contract.material * materialPctComplete;
    const otherEarned = job.contract.other * otherPctComplete;
    
    return {
      labor: laborEarned,
      material: materialEarned,
      other: otherEarned,
      total: laborEarned + materialEarned + otherEarned,
    };
  }
};

/**
 * Calculate over/under billed amount
 * Positive = Over Billed (good - collected more than earned)
 * Negative = Under Billed (need to invoice more)
 */
export const calculateBillingDifference = (job: Job): {
  difference: number;
  isOverBilled: boolean;
  label: string;
} => {
  const earned = calculateEarnedRevenue(job);
  const totalInvoiced = sumBreakdown(job.invoiced);
  const difference = totalInvoiced - earned.total;
  
  return {
    difference,
    isOverBilled: difference > 0,
    label: difference > 0 ? 'Over Billed' : 'Under Billed',
  };
};

/**
 * Calculate forecasted profit for a job
 */
export const calculateForecastedProfit = (job: Job): number => {
  if (job.jobType === 'time-material' && job.tmSettings) {
    // For T&M, profit is earned revenue minus costs
    const earned = calculateEarnedRevenue(job);
    const totalCosts = sumBreakdown(job.costs);
    return earned.total - totalCosts;
  } else {
    // For fixed price, profit is contract minus forecasted costs
    const totalContract = sumBreakdown(job.contract);
    const totalCosts = sumBreakdown(job.costs);
    const totalCostToComplete = sumBreakdown(job.costToComplete);
    return totalContract - (totalCosts + totalCostToComplete);
  }
};

/**
 * Get the % complete for a job (only meaningful for fixed-price jobs)
 */
export const calculatePercentComplete = (job: Job): number => {
  const totalBudget = sumBreakdown(job.budget);
  const totalCosts = sumBreakdown(job.costs);
  
  if (totalBudget === 0) return 0;
  return (totalCosts / totalBudget) * 100;
};

/**
 * Default T&M settings for new T&M jobs
 */
export const getDefaultTMSettings = () => ({
  laborBillingType: 'markup' as const,
  laborMarkup: 1.5,      // 50% markup
  materialMarkup: 1.15,  // 15% markup
  otherMarkup: 1.10,     // 10% markup
});

/**
 * Schedule warning types
 */
export interface ScheduleWarning {
  type: 'mobilization-past-contract' | 'behind-target' | 'phase-overlap';
  phaseId?: number;
  message: string;
  severity: 'warning' | 'critical';
}

/**
 * Check if a job has any mobilization phases that extend beyond the contract end date
 */
export const getMobilizationWarnings = (job: Job): ScheduleWarning[] => {
  const warnings: ScheduleWarning[] = [];
  
  // Skip if no contract end date
  if (!job.endDate || job.endDate === 'TBD') {
    return warnings;
  }
  
  const contractEndDate = new Date(job.endDate).getTime();
  
  // Check mobilization phases
  if (job.mobilizations && job.mobilizations.length > 0) {
    job.mobilizations.forEach(mob => {
      if (!mob.enabled) return;
      
      // Check if demobilization date is past contract end
      if (mob.demobilizeDate && mob.demobilizeDate !== 'TBD') {
        const demobDate = new Date(mob.demobilizeDate).getTime();
        if (demobDate > contractEndDate) {
          const daysOver = Math.ceil((demobDate - contractEndDate) / (1000 * 60 * 60 * 24));
          warnings.push({
            type: 'mobilization-past-contract',
            phaseId: mob.id,
            message: `Phase ${mob.id}${mob.description ? ` (${mob.description})` : ''} demob is ${daysOver} day${daysOver !== 1 ? 's' : ''} past contract end`,
            severity: daysOver > 14 ? 'critical' : 'warning',
          });
        }
      }
      
      // Check if mobilization date is past contract end (shouldn't happen but check anyway)
      if (mob.mobilizeDate && mob.mobilizeDate !== 'TBD') {
        const mobDate = new Date(mob.mobilizeDate).getTime();
        if (mobDate > contractEndDate) {
          warnings.push({
            type: 'mobilization-past-contract',
            phaseId: mob.id,
            message: `Phase ${mob.id}${mob.description ? ` (${mob.description})` : ''} mobilization starts after contract end`,
            severity: 'critical',
          });
        }
      }
    });
  }
  
  return warnings;
};

/**
 * Check if job is behind target date (legacy check)
 */
export const isJobBehindTargetDate = (job: Job): boolean => {
  if (!job.targetEndDate || job.targetEndDate === 'TBD' || job.endDate === 'TBD') {
    return false;
  }
  const plannedCompletion = new Date(job.targetEndDate).getTime();
  const currentCompletion = new Date(job.endDate).getTime();
  return currentCompletion > plannedCompletion;
};

/**
 * Check if job has any schedule warnings (mobilization or target date)
 * This is the main function to use for the "Behind Schedule" filter
 */
export const hasScheduleWarnings = (job: Job): boolean => {
  // Check mobilization warnings
  const mobWarnings = getMobilizationWarnings(job);
  if (mobWarnings.length > 0) {
    return true;
  }
  
  // Check target date
  if (isJobBehindTargetDate(job)) {
    return true;
  }
  
  return false;
};

/**
 * Get all schedule warnings for a job (mobilization + target date)
 */
export const getAllScheduleWarnings = (job: Job): ScheduleWarning[] => {
  const warnings: ScheduleWarning[] = [];
  
  // Add mobilization warnings
  warnings.push(...getMobilizationWarnings(job));
  
  // Add target date warning
  if (isJobBehindTargetDate(job)) {
    const targetDate = new Date(job.targetEndDate!);
    const endDate = new Date(job.endDate);
    const daysLate = Math.ceil((endDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
    warnings.push({
      type: 'behind-target',
      message: `Job is ${daysLate} day${daysLate !== 1 ? 's' : ''} behind target completion`,
      severity: daysLate > 30 ? 'critical' : 'warning',
    });
  }
  
  return warnings;
};
