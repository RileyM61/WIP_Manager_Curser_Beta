import React, { useMemo } from 'react';
import { Job, JobStatus } from '../../../types';
import { calculateBillingDifference, calculateEarnedRevenue, sumBreakdown } from '../lib/jobCalculations';

interface PortfolioHealthScoreProps {
  jobs: Job[];
  userRole: 'owner' | 'projectManager' | 'estimator';
}

interface HealthMetrics {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  underbilledPercent: number;
  avgMarginVariance: number;
  behindSchedulePercent: number;
  totalActiveJobs: number;
}

const calculateHealthMetrics = (jobs: Job[]): HealthMetrics => {
  const activeJobs = jobs.filter(job => job.status === JobStatus.Active || job.status === JobStatus.OnHold);
  
  if (activeJobs.length === 0) {
    return {
      score: 100,
      grade: 'A',
      underbilledPercent: 0,
      avgMarginVariance: 0,
      behindSchedulePercent: 0,
      totalActiveJobs: 0,
    };
  }

  // Calculate underbilled jobs percentage
  const underbilledJobs = activeJobs.filter(job => {
    const billing = calculateBillingDifference(job);
    return billing.difference < 0;
  });
  const underbilledPercent = (underbilledJobs.length / activeJobs.length) * 100;

  // Calculate average margin variance (forecasted vs original)
  let totalMarginVariance = 0;
  let fixedPriceJobCount = 0;
  for (const job of activeJobs) {
    if (job.jobType !== 'time-material') {
      const totalContract = sumBreakdown(job.contract);
      const totalBudget = sumBreakdown(job.budget);
      const totalCosts = sumBreakdown(job.costs);
      const totalCostToComplete = sumBreakdown(job.costToComplete);
      
      const originalProfit = totalContract - totalBudget;
      const forecastedProfit = totalContract - (totalCosts + totalCostToComplete);
      const variance = forecastedProfit - originalProfit;
      
      // Normalize by original profit to get percentage
      if (totalContract > 0) {
        totalMarginVariance += (variance / totalContract) * 100;
        fixedPriceJobCount++;
      }
    }
  }
  const avgMarginVariance = fixedPriceJobCount > 0 ? totalMarginVariance / fixedPriceJobCount : 0;

  // Calculate behind schedule percentage
  const behindScheduleJobs = activeJobs.filter(job => {
    if (!job.targetEndDate || job.targetEndDate === 'TBD' || !job.endDate || job.endDate === 'TBD') {
      return false;
    }
    const target = new Date(job.targetEndDate).getTime();
    const current = new Date(job.endDate).getTime();
    const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;
    return current > target + twoWeeksMs;
  });
  const behindSchedulePercent = (behindScheduleJobs.length / activeJobs.length) * 100;

  // Calculate overall score (0-100)
  // Underbilling penalty: -2 points per % of jobs underbilled (max -40)
  // Margin variance penalty: -3 points per % of negative variance (max -30)
  // Schedule penalty: -3 points per % of jobs behind schedule (max -30)
  let score = 100;
  score -= Math.min(underbilledPercent * 0.4, 40);
  score -= Math.min(Math.max(-avgMarginVariance, 0) * 3, 30);
  score -= Math.min(behindSchedulePercent * 0.3, 30);
  score = Math.max(0, Math.round(score));

  // Determine grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';

  return {
    score,
    grade,
    underbilledPercent,
    avgMarginVariance,
    behindSchedulePercent,
    totalActiveJobs: activeJobs.length,
  };
};

const gradeColors = {
  A: 'from-green-500 to-emerald-500 text-white',
  B: 'from-blue-500 to-cyan-500 text-white',
  C: 'from-yellow-500 to-wip-gold text-white',
  D: 'from-wip-gold to-red-400 text-white',
  F: 'from-red-600 to-red-700 text-white',
};

const gradeBackgrounds = {
  A: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  B: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  C: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  D: 'bg-wip-card dark:bg-wip-gold/20 border-wip-border dark:border-wip-gold/50',
  F: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
};

const PortfolioHealthScore: React.FC<PortfolioHealthScoreProps> = ({ jobs, userRole }) => {
  const metrics = useMemo(() => calculateHealthMetrics(jobs), [jobs]);

  // Only show for owners
  if (userRole !== 'owner') {
    return null;
  }

  // Don't show if no active jobs
  if (metrics.totalActiveJobs === 0) {
    return null;
  }

  return (
    <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-6">
        {/* Grade Badge */}
        <div className="flex items-center gap-5">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradeColors[metrics.grade]} flex items-center justify-center shadow-lg`}>
            <span className="text-3xl font-bold">{metrics.grade}</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Portfolio Health
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${gradeColors[metrics.grade]}`}
                  style={{ width: `${metrics.score}%` }}
                />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {metrics.score}/100
              </span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {metrics.totalActiveJobs} active job{metrics.totalActiveJobs !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="flex items-center gap-8">
          <div className="text-center">
            <p className={`text-xl font-bold ${metrics.underbilledPercent > 50 ? 'text-red-600 dark:text-red-400' : metrics.underbilledPercent > 25 ? 'text-wip-gold-dark dark:text-wip-gold' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {metrics.underbilledPercent.toFixed(0)}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Underbilled</p>
          </div>
          <div className="w-px h-10 bg-gray-200 dark:bg-gray-700" />
          <div className="text-center">
            <p className={`text-xl font-bold ${metrics.avgMarginVariance < -5 ? 'text-red-600 dark:text-red-400' : metrics.avgMarginVariance < 0 ? 'text-wip-gold-dark dark:text-wip-gold' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {metrics.avgMarginVariance >= 0 ? '+' : ''}{metrics.avgMarginVariance.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Margin Var</p>
          </div>
          <div className="w-px h-10 bg-gray-200 dark:bg-gray-700" />
          <div className="text-center">
            <p className={`text-xl font-bold ${metrics.behindSchedulePercent > 30 ? 'text-red-600 dark:text-red-400' : metrics.behindSchedulePercent > 10 ? 'text-wip-gold-dark dark:text-wip-gold' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {metrics.behindSchedulePercent.toFixed(0)}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Behind Sched</p>
          </div>
        </div>
      </div>

      {/* Health Insights */}
      {metrics.grade !== 'A' && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {metrics.grade === 'B' && '👍 Good performance. Focus on the few jobs that need attention.'}
            {metrics.grade === 'C' && '⚠️ Some concerns. Review underbilled jobs and margin drift this week.'}
            {metrics.grade === 'D' && '🚨 Action needed. Multiple jobs require immediate attention.'}
            {metrics.grade === 'F' && '🔥 Critical issues across the portfolio. Schedule PM reviews immediately.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default PortfolioHealthScore;
