import React, { useState, useMemo } from 'react';
import { Job, JobStatus } from '../../../types';
import { calculateScheduleDrift, calculateMarginFade } from '../lib/smartEngines';
import { calculateBillingDifference, calculateEarnedRevenue, sumBreakdown } from '../lib/jobCalculations';

interface NeedsAttentionQueueProps {
  jobs: Job[];
  onReviewJob: (job: Job) => void;
  isPro: boolean;
}

interface AttentionItem {
  job: Job;
  reasons: {
    type: 'underbilling' | 'margin-fade' | 'schedule-drift';
    message: string;
    severity: 'high' | 'medium';
  }[];
  profitVariance: number;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

// Calculate underbilling percentage relative to earned revenue
const calculateUnderbillingPercent = (job: Job): number => {
  const earnedRevenue = calculateEarnedRevenue(job);
  if (earnedRevenue.total === 0) return 0;
  
  const invoicedTotal = sumBreakdown(job.invoiced);
  const billingPosition = invoicedTotal - earnedRevenue.total;
  
  // Only care about underbilling (negative position)
  if (billingPosition >= 0) return 0;
  
  // Return absolute percentage of underbilling relative to earned revenue
  return Math.abs(billingPosition / earnedRevenue.total) * 100;
};

// Calculate profit variance (same as JobCardGrid)
const calculateProfitVariance = (job: Job): number => {
  const totalContract = sumBreakdown(job.contract);
  const totalBudget = sumBreakdown(job.budget);
  const totalCosts = sumBreakdown(job.costs);
  const totalCostToComplete = sumBreakdown(job.costToComplete);
  
  const originalProfit = totalContract - totalBudget;
  const forecastedCost = totalCosts + totalCostToComplete;
  const forecastedProfit = totalContract - forecastedCost;
  
  // For T&M jobs, just return forecasted profit; for Fixed, return variance
  if (job.jobType === 'tm') {
    return forecastedProfit;
  }
  return forecastedProfit - originalProfit;
};

const NeedsAttentionQueue: React.FC<NeedsAttentionQueueProps> = ({ jobs, onReviewJob, isPro }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Find jobs that need attention
  const attentionItems = useMemo((): AttentionItem[] => {
    // Only check Active and On Hold jobs
    const activeJobs = jobs.filter(
      job => job.status === JobStatus.Active || job.status === JobStatus.OnHold
    );

    const items: AttentionItem[] = [];

    for (const job of activeJobs) {
      const reasons: AttentionItem['reasons'] = [];
      const profitVariance = calculateProfitVariance(job);

      // Check underbilling > 50%
      const underbillingPercent = calculateUnderbillingPercent(job);
      if (underbillingPercent > 50) {
        reasons.push({
          type: 'underbilling',
          message: `Underbilled ${underbillingPercent.toFixed(0)}%`,
          severity: underbillingPercent > 75 ? 'high' : 'medium',
        });
      }

      // Check margin fade > 10 points
      const marginFade = calculateMarginFade(job);
      if (marginFade.fadePercent > 10) {
        reasons.push({
          type: 'margin-fade',
          message: `Margin fading: -${marginFade.fadePercent.toFixed(1)} pts`,
          severity: marginFade.fadePercent > 20 ? 'high' : 'medium',
        });
      }

      // Check schedule drift (>2 weeks)
      const scheduleDriftWeeks = calculateScheduleDrift(job);
      if (scheduleDriftWeeks > 2) {
        reasons.push({
          type: 'schedule-drift',
          message: `${scheduleDriftWeeks} weeks behind schedule`,
          severity: scheduleDriftWeeks > 4 ? 'high' : 'medium',
        });
      }

      if (reasons.length > 0) {
        items.push({ job, reasons, profitVariance });
      }
    }

    // Sort by severity (jobs with high severity issues first)
    return items.sort((a, b) => {
      const aHasHigh = a.reasons.some(r => r.severity === 'high');
      const bHasHigh = b.reasons.some(r => r.severity === 'high');
      if (aHasHigh && !bHasHigh) return -1;
      if (!aHasHigh && bHasHigh) return 1;
      return b.reasons.length - a.reasons.length;
    });
  }, [jobs]);

  // Don't render if no items need attention
  if (attentionItems.length === 0) {
    return null;
  }

  // For non-Pro users, show a teaser
  if (!isPro) {
    return (
      <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
              <span className="text-xl">🔒</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {attentionItems.length} Job{attentionItems.length !== 1 ? 's' : ''} Need Attention
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upgrade to Pro to see which jobs need action
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
            Pro
          </span>
        </div>
      </div>
    );
  }

  const highSeverityCount = attentionItems.filter(item => 
    item.reasons.some(r => r.severity === 'high')
  ).length;

  // Calculate PM aggregation
  const pmBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    for (const item of attentionItems) {
      const pm = item.job.projectManager || 'Unassigned';
      breakdown[pm] = (breakdown[pm] || 0) + 1;
    }
    // Sort by count descending
    return Object.entries(breakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3); // Top 3 PMs
  }, [attentionItems]);

  return (
    <div className="mb-6 bg-gradient-to-r from-red-50 to-amber-50 dark:from-red-900/20 dark:to-amber-900/20 border border-red-200 dark:border-red-800 rounded-xl overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            highSeverityCount > 0 
              ? 'bg-red-100 dark:bg-red-900/50' 
              : 'bg-amber-100 dark:bg-amber-900/50'
          }`}>
            <span className="text-xl">{highSeverityCount > 0 ? '🚨' : '⚠️'}</span>
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              Needs Attention
              <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                highSeverityCount > 0
                  ? 'bg-red-500 text-white'
                  : 'bg-amber-500 text-white'
              }`}>
                {attentionItems.length}
              </span>
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {highSeverityCount > 0 
                ? `${highSeverityCount} critical issue${highSeverityCount !== 1 ? 's' : ''} requiring immediate action`
                : 'Jobs with billing, margin, or schedule concerns'
              }
            </p>
            {/* PM Aggregation Summary */}
            {pmBreakdown.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                <span className="font-semibold">By PM:</span>{' '}
                {pmBreakdown.map(([pm, count], idx) => (
                  <span key={pm}>
                    {pm} ({count})
                    {idx < pmBreakdown.length - 1 ? ' • ' : ''}
                  </span>
                ))}
              </p>
            )}
          </div>
        </div>
        <svg 
          className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expandable job list */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          {attentionItems.map(({ job, reasons, profitVariance }) => {
            const billingInfo = calculateBillingDifference(job);
            const hasHighSeverity = reasons.some(r => r.severity === 'high');
            const isTM = job.jobType === 'tm';

            return (
              <div
                key={job.id}
                className={`bg-white dark:bg-gray-800 rounded-lg border ${
                  hasHighSeverity 
                    ? 'border-red-300 dark:border-red-700' 
                    : 'border-amber-200 dark:border-amber-800'
                } p-3 hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                        {job.jobName}
                      </h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        #{job.jobNo}
                      </span>
                    </div>
                    
                    {/* Reason badges */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {reasons.map((reason, idx) => (
                        <span
                          key={idx}
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            reason.severity === 'high'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                          }`}
                        >
                          {reason.type === 'underbilling' && '💰'}
                          {reason.type === 'margin-fade' && '📉'}
                          {reason.type === 'schedule-drift' && '⏰'}
                          <span className="ml-1">{reason.message}</span>
                        </span>
                      ))}
                    </div>

                    {/* Quick stats */}
                    <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                      <span>
                        {isTM ? 'Profit' : 'Profit Var'}: <span className={profitVariance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                          {profitVariance >= 0 ? '+' : ''}{currencyFormatter.format(profitVariance)}
                        </span>
                      </span>
                      {billingInfo.difference !== 0 && (
                        <span>
                          {billingInfo.isOverBilled ? 'Over' : 'Under'}: <span className={billingInfo.isOverBilled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {currencyFormatter.format(Math.abs(billingInfo.difference))}
                          </span>
                        </span>
                      )}
                      <span>PM: {job.projectManager}</span>
                    </div>
                  </div>

                  {/* Action button */}
                  <button
                    onClick={() => onReviewJob(job)}
                    className={`flex-shrink-0 px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                      hasHighSeverity
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-amber-500 hover:bg-amber-600 text-white'
                    }`}
                  >
                    Review
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NeedsAttentionQueue;
