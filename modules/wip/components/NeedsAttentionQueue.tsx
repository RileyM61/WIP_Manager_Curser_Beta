import React, { useState, useMemo } from 'react';
import { Job, JobStatus } from '../../../types';
import { calculateScheduleDrift, calculateMarginFade } from '../lib/smartEngines';
import { calculateBillingDifference, calculateEarnedRevenue, sumBreakdown } from '../lib/jobCalculations';
import InfoTooltip from '../../../components/help/InfoTooltip';

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

// Hook for managing cleared attention items
const STORAGE_KEY = 'wipInsights_clearedAttentionItems';

interface ClearedItems {
  [jobId: string]: string; // jobId -> lastUpdated timestamp when cleared
}

const getClearedItems = (): ClearedItems => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const clearItem = (jobId: string, lastUpdated: string | undefined) => {
  try {
    const cleared = getClearedItems();
    cleared[jobId] = lastUpdated || new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleared));
  } catch {
    // Silently fail if localStorage is not available
  }
};

const isClearedItem = (jobId: string, lastUpdated: string | undefined): boolean => {
  const cleared = getClearedItems();
  const clearedTimestamp = cleared[jobId];
  if (!clearedTimestamp) return false;
  // Item is cleared only if the lastUpdated hasn't changed since it was cleared
  return lastUpdated === clearedTimestamp || (!lastUpdated && !!clearedTimestamp);
};

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
  const [clearTrigger, setClearTrigger] = useState(0); // Trigger re-render when items are cleared
  
  const handleClearItem = (jobId: string, lastUpdated: string | undefined) => {
    clearItem(jobId, lastUpdated);
    setClearTrigger(prev => prev + 1); // Trigger re-render
  };

  // Find jobs that need attention
  const attentionItems = useMemo((): AttentionItem[] => {
    // Only check Active and On Hold jobs
    const activeJobs = jobs.filter(
      job => job.status === JobStatus.Active || job.status === JobStatus.OnHold
    );

    const items: AttentionItem[] = [];

    for (const job of activeJobs) {
      // Skip if this job was cleared and hasn't been updated since
      if (isClearedItem(job.id, job.lastUpdated)) {
        continue;
      }
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
  }, [jobs, clearTrigger]);

  // Don't render if no items need attention
  if (attentionItems.length === 0) {
    return null;
  }

  // For non-Pro users, show a teaser
  if (!isPro) {
    return (
      <div className="mb-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
              <span className="text-2xl">🔒</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                {attentionItems.length} Job{attentionItems.length !== 1 ? 's' : ''} Need Attention
                <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-500 text-white rounded">PRO</span>
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Upgrade to see which jobs need immediate action
              </p>
            </div>
          </div>
          <button
            onClick={() => window.open('/upgrade', '_blank')}
            className="px-4 py-2 text-sm font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 border border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all"
          >
            Learn More
          </button>
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
    <div className="mb-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
            highSeverityCount > 0 
              ? 'bg-red-100 dark:bg-red-900/30' 
              : 'bg-amber-100 dark:bg-amber-900/30'
          }`}>
            <span className="text-2xl">{highSeverityCount > 0 ? '🚨' : '⚠️'}</span>
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
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {highSeverityCount > 0 
                ? `${highSeverityCount} critical issue${highSeverityCount !== 1 ? 's' : ''} requiring immediate action`
                : 'Jobs with billing, margin, or schedule concerns'
              }
            </p>
            {/* PM Aggregation Summary */}
            {pmBreakdown.length > 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                <span className="font-medium">By PM:</span>{' '}
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
        <div className="flex items-center gap-3">
          {highSeverityCount > 0 && (
            <span className="hidden sm:inline-flex items-center px-3 py-1 text-xs font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 rounded-full">
              Action Required
            </span>
          )}
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expandable job list */}
      {isExpanded && (
        <div className="px-5 pb-5 space-y-3 border-t border-gray-100 dark:border-gray-700/50 pt-4">
          {attentionItems.map(({ job, reasons, profitVariance }) => {
            const billingInfo = calculateBillingDifference(job);
            const hasHighSeverity = reasons.some(r => r.severity === 'high');
            const isTM = job.jobType === 'tm';

            return (
              <div
                key={job.id}
                className={`bg-gray-50 dark:bg-gray-700/30 rounded-xl border ${
                  hasHighSeverity 
                    ? 'border-red-200 dark:border-red-800/50' 
                    : 'border-gray-200 dark:border-gray-600/50'
                } p-4 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                        {job.jobName}
                      </h4>
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                        #{job.jobNo}
                      </span>
                    </div>
                    
                    {/* Reason badges */}
                    <div className="flex flex-wrap gap-2 mb-3 items-center">
                      {reasons.map((reason, idx) => (
                        <span
                          key={idx}
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                            reason.severity === 'high'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                          }`}
                        >
                          {reason.type === 'underbilling' && '💰'}
                          {reason.type === 'margin-fade' && '📉'}
                          {reason.type === 'schedule-drift' && '⏰'}
                          <span className="ml-1.5">{reason.message}</span>
                          {reason.type === 'schedule-drift' && (
                            <span className="ml-1">
                              <InfoTooltip
                                shortText="Job is falling behind based on financial progress vs time elapsed"
                                detailedText="Schedule drift compares how much time has passed versus how much budget has been spent. If you're 50% through the project timeline but have only spent 25% of your budget, you're drifting behind schedule. This calculation helps predict when a job might finish later than expected based on current spending patterns."
                                title="Behind Schedule"
                                example="Example: If a 10-week job is 5 weeks in (50% of timeline) but only 25% of the budget has been spent, the schedule drift would be 2.5 weeks behind. This indicates the job is progressing slower financially than expected."
                                size="sm"
                              />
                            </span>
                          )}
                        </span>
                      ))}
                    </div>

                    {/* Quick stats */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        {isTM ? 'Profit' : 'Variance'}: <span className={`font-semibold ${profitVariance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {profitVariance >= 0 ? '+' : ''}{currencyFormatter.format(profitVariance)}
                        </span>
                      </span>
                      {billingInfo.difference !== 0 && (
                        <span>
                          {billingInfo.isOverBilled ? 'Over' : 'Under'}: <span className={`font-semibold ${billingInfo.isOverBilled ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {currencyFormatter.format(Math.abs(billingInfo.difference))}
                          </span>
                        </span>
                      )}
                      <span className="text-gray-400">•</span>
                      <span>PM: <span className="font-medium text-gray-700 dark:text-gray-300">{job.projectManager}</span></span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex-shrink-0 flex flex-col gap-2">
                    <button
                      onClick={() => onReviewJob(job)}
                      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 active:scale-95 ${
                        hasHighSeverity
                          ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md'
                          : 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm hover:shadow-md'
                      }`}
                    >
                      Review
                    </button>
                    <button
                      onClick={() => handleClearItem(job.id, job.lastUpdated)}
                      className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-gray-200 transition-all duration-200 active:scale-95"
                    >
                      Dismiss
                    </button>
                  </div>
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
