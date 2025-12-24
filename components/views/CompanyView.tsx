import React from 'react';
import { Job, JobStatus, JobsSnapshot, CapacityPlan, CapacityRow } from '../../types';
import { sumBreakdown, calculateEarnedRevenue, calculateBillingDifference, calculateForecastedProfit } from '../../modules/wip/lib/jobCalculations';

interface LaborCapacityData {
  weeklyProductiveHours: number;
  monthlyProductiveHours: number;
  productiveFte: number;
  lastUpdated: string | null;
  departmentBreakdown: {
    name: string;
    weeklyHours: number;
    fte: number;
  }[];
}

interface CompanyViewProps {
  jobs: Job[];
  snapshot: JobsSnapshot | null;
  projectManagers: string[];
  capacityPlan?: CapacityPlan | null;
  capacityEnabled: boolean;
  onEditCapacity: () => void;
  // Labor Capacity integration
  laborCapacity?: LaborCapacityData | null;
  laborCapacityEnabled?: boolean;
  onNavigateToLaborCapacity?: () => void;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const hoursFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

const headcountFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const hoursPerPersonFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const calculateTotalEarnedRevenue = (jobList: Job[]): number => {
  if (!jobList) return 0;
  return jobList.reduce((total, job) => {
    const earned = calculateEarnedRevenue(job);
    return total + earned.total;
  }, 0);
};

// Check if a job is behind schedule (target end date vs current end date)
const isJobBehindSchedule = (job: Job): boolean => {
  if (!job.targetEndDate || job.targetEndDate === 'TBD' || !job.endDate || job.endDate === 'TBD') {
    return false;
  }
  const target = new Date(job.targetEndDate).getTime();
  const current = new Date(job.endDate).getTime();
  // Behind schedule if current end date is more than 2 weeks past target
  const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;
  return current > target + twoWeeksMs;
};

// Calculate PM performance metrics
interface PMScorecard {
  name: string;
  activeJobs: number;
  avgMargin: number;
  totalUnderbilled: number;
  jobsBehindSchedule: number;
  marginRank: 'good' | 'warning' | 'critical';
  billingRank: 'good' | 'warning' | 'critical';
  scheduleRank: 'good' | 'warning' | 'critical';
}

const calculatePMScorecards = (jobsByPm: Record<string, any[]>): PMScorecard[] => {
  return Object.entries(jobsByPm).map(([pmName, pmJobs]) => {
    const activeJobs = pmJobs.filter(job => job.status === JobStatus.Active);
    const totalMargin = activeJobs.reduce((sum, job) => sum + job.profitMargin, 0);
    const avgMargin = activeJobs.length > 0 ? totalMargin / activeJobs.length : 0;
    
    // Calculate total underbilled (only negative billing differences)
    const totalUnderbilled = pmJobs
      .filter(job => job.billingDifference < 0)
      .reduce((sum, job) => sum + Math.abs(job.billingDifference), 0);
    
    // Count jobs behind schedule
    const jobsBehindSchedule = pmJobs.filter(job => 
      job.status === JobStatus.Active && isJobBehindSchedule(job)
    ).length;
    
    // Determine rankings
    const marginRank: 'good' | 'warning' | 'critical' = 
      avgMargin >= 20 ? 'good' : avgMargin >= 10 ? 'warning' : 'critical';
    const billingRank: 'good' | 'warning' | 'critical' = 
      totalUnderbilled === 0 ? 'good' : totalUnderbilled < 50000 ? 'warning' : 'critical';
    const scheduleRank: 'good' | 'warning' | 'critical' = 
      jobsBehindSchedule === 0 ? 'good' : jobsBehindSchedule === 1 ? 'warning' : 'critical';
    
    return {
      name: pmName,
      activeJobs: activeJobs.length,
      avgMargin,
      totalUnderbilled,
      jobsBehindSchedule,
      marginRank,
      billingRank,
      scheduleRank,
    };
  }).sort((a, b) => b.activeJobs - a.activeJobs); // Sort by active jobs desc
};

const CompanyView: React.FC<CompanyViewProps> = ({ 
  jobs, 
  snapshot, 
  projectManagers, 
  capacityPlan, 
  capacityEnabled, 
  onEditCapacity,
  laborCapacity,
  laborCapacityEnabled,
  onNavigateToLaborCapacity,
}) => {
  
  const jobsWithMetrics = jobs.map(job => {
    const isTM = job.jobType === 'time-material';
    const totalContract = sumBreakdown(job.contract);
    const totalBudget = sumBreakdown(job.budget);
    const totalCost = sumBreakdown(job.costs);

    // Use shared calculation functions
    const earnedRevenue = calculateEarnedRevenue(job);
    const billingInfo = calculateBillingDifference(job);
    const forecastedProfit = calculateForecastedProfit(job);

    // For T&M, profit margin is based on earned revenue; for fixed price, based on contract
    const profitMargin = isTM
      ? (earnedRevenue.total > 0 ? (forecastedProfit / earnedRevenue.total) * 100 : 0)
      : (totalContract > 0 ? ((totalContract - totalBudget) / totalContract) * 100 : 0);

    let daysOpen: number | null = null;
    if (job.status === JobStatus.Active && job.startDate !== 'TBD') {
        const startDate = new Date(job.startDate);
        const today = new Date();
        if (today > startDate) {
          daysOpen = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        } else {
            daysOpen = 0;
        }
    }

    return { 
      ...job, 
      profitMargin, 
      billingDifference: billingInfo.difference, 
      earnedRevenue: earnedRevenue.total,
      daysOpen,
      isTM 
    };
  });

  const backlogToEarn = jobs.reduce((acc, job) => {
    const earned = calculateEarnedRevenue(job);
    
    if (job.jobType === 'time-material') {
      // For T&M, there's no fixed "backlog" - it's based on ongoing work
      // We could show remaining budget if one is set, or just skip T&M jobs
      return acc;
    }
    
    const totalContract = sumBreakdown(job.contract);
    const remainingRevenue = Math.max(totalContract - earned.total, 0);
    return acc + remainingRevenue;
  }, 0);

  const jobsByPm = jobsWithMetrics.reduce((acc, job) => {
    const pm = job.projectManager || 'Unassigned';
    if (!acc[pm]) {
      acc[pm] = [];
    }
    acc[pm].push(job);
    return acc;
  }, {} as Record<string, typeof jobsWithMetrics>);

  const totalNetBillingDifference = jobsWithMetrics.reduce((acc, job) => acc + job.billingDifference, 0);
  const totalProfitMargin = jobsWithMetrics.reduce((acc, job) => acc + job.profitMargin, 0);
  const averageProfitMargin = jobsWithMetrics.length > 0 ? totalProfitMargin / jobsWithMetrics.length : 0;

  // Count job types
  const tmJobCount = jobs.filter(j => j.jobType === 'time-material').length;
  const fixedJobCount = jobs.filter(j => j.jobType !== 'time-material').length;

  const totalActiveJobs = jobs.filter(job => job.status === JobStatus.Active).length;
  const totalFutureJobs = jobs.filter(job => job.status === JobStatus.Future).length;
  const pmCount = projectManagers.length || 1;
  const avgJobsPerPm = pmCount > 0 ? totalActiveJobs / pmCount : 0;
  const pmLoadClass = avgJobsPerPm >= 4.5
    ? 'text-red-600 dark:text-red-400'
    : avgJobsPerPm >= 3
      ? 'text-yellow-600 dark:text-yellow-400'
      : 'text-green-600 dark:text-green-400';

  const currentEarnedRevenue = calculateTotalEarnedRevenue(jobs);
  const previousEarnedRevenue = calculateTotalEarnedRevenue(snapshot?.jobs || []);
  const weeklyEarnedRevenue = currentEarnedRevenue - previousEarnedRevenue;
  const snapshotDate = snapshot ? new Date(snapshot.timestamp).toLocaleDateString() : 'N/A';

  // Calculate PM Scorecards
  const pmScorecards = calculatePMScorecards(jobsByPm);

  // Calculate previous billing position for trend
  const previousBillingPosition = snapshot?.jobs ? snapshot.jobs.reduce((acc, job) => {
    const earned = calculateEarnedRevenue(job);
    const invoiced = sumBreakdown(job.invoiced);
    return acc + (invoiced - earned.total);
  }, 0) : null;
  const billingTrend = previousBillingPosition !== null 
    ? totalNetBillingDifference - previousBillingPosition 
    : null;

  const capacityRows: CapacityRow[] = Array.isArray(capacityPlan?.rows) ? capacityPlan.rows : [];
  const totalAvailableCapacity = capacityRows.reduce((sum, row) => sum + row.headcount * row.hoursPerPerson, 0);
  const totalCommittedCapacity = capacityRows.reduce((sum, row) => sum + row.committedHours, 0);
  const capacityBalance = totalAvailableCapacity - totalCommittedCapacity;
  const capacityUtilization = totalAvailableCapacity > 0 ? (totalCommittedCapacity / totalAvailableCapacity) * 100 : 0;
  const capacityBalanceClass = capacityBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const capacityUtilizationClass = capacityUtilization <= 100 ? 'text-brand-blue dark:text-brand-light-blue' : 'text-red-600 dark:text-red-400';
  const capacityHorizonLabel = capacityPlan?.planningHorizonWeeks || 1;
  const capacityLastUpdated = capacityPlan?.lastUpdated ? new Date(capacityPlan.lastUpdated).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }) : null;

  if (jobs.length === 0) {
    return <div className="text-center py-16 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg shadow-sm">No jobs to display.</div>;
  }
  
  const lastUpdatedTimestamp = snapshot ? new Date(snapshot.timestamp).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }) : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-brand-blue dark:text-brand-light-blue">Company Performance Summary</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Financial overview by Project Manager.</p>
        {lastUpdatedTimestamp && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Data as of: <span className="font-semibold text-gray-500 dark:text-gray-400">{lastUpdatedTimestamp}</span>
          </p>
        )}
      </div>

      <div className="p-5 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Company-Wide Totals</h3>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Backlog (Revenue to Earn)</p>
            <p className="text-2xl font-bold text-brand-blue dark:text-brand-light-blue">
              {currencyFormatter.format(backlogToEarn)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Earned this week: {currencyFormatter.format(weeklyEarnedRevenue)} (since {snapshotDate})
            </p>
            {tmJobCount > 0 && (
              <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                Note: {tmJobCount} T&M job{tmJobCount > 1 ? 's' : ''} not included in backlog
              </p>
            )}
          </div>
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Net Billing Status</p>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-bold ${totalNetBillingDifference >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {currencyFormatter.format(Math.abs(totalNetBillingDifference))}
              </p>
              {billingTrend !== null && billingTrend !== 0 && (
                <span className={`flex items-center text-xs font-semibold px-1.5 py-0.5 rounded ${
                  billingTrend > 0 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {billingTrend > 0 ? '↑' : '↓'} {currencyFormatter.format(Math.abs(billingTrend))}
                </span>
              )}
            </div>
            <p className={`text-xs font-semibold ${totalNetBillingDifference >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              ({totalNetBillingDifference >= 0 ? 'Over Billed' : 'Under Billed'})
            </p>
            {billingTrend !== null && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {billingTrend > 0 ? 'Improved' : 'Declined'} since {snapshotDate}
              </p>
            )}
          </div>
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Overall Average Profit Margin</p>
            <p className={`text-2xl font-bold ${averageProfitMargin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {averageProfitMargin.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Across {jobsWithMetrics.length} jobs
            </p>
          </div>
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Job Types</p>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <span className="px-2 py-0.5 text-xs font-medium rounded bg-wip-card text-wip-gold-dark dark:bg-wip-gold/30 dark:text-wip-gold">Fixed</span>
                <span className="text-lg font-bold text-gray-700 dark:text-gray-200">{fixedJobCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">T&M</span>
                <span className="text-lg font-bold text-gray-700 dark:text-gray-200">{tmJobCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PM Performance Scorecard */}
      {pmScorecards.length > 0 && (
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">PM Performance Scorecard</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Compare project manager performance at a glance</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Project Manager</th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Active Jobs</th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Avg Margin</th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Underbilled</th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Behind Schedule</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {pmScorecards.map((pm) => (
                  <tr key={pm.name} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                          {pm.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{pm.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className="text-lg font-bold text-gray-700 dark:text-gray-200">{pm.activeJobs}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold ${
                        pm.marginRank === 'good' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : pm.marginRank === 'warning'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {pm.avgMargin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold ${
                        pm.billingRank === 'good'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : pm.billingRank === 'warning'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {pm.totalUnderbilled === 0 ? '✓ None' : currencyFormatter.format(pm.totalUnderbilled)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold ${
                        pm.scheduleRank === 'good'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : pm.scheduleRank === 'warning'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {pm.jobsBehindSchedule === 0 ? '✓ On Track' : `${pm.jobsBehindSchedule} job${pm.jobsBehindSchedule > 1 ? 's' : ''}`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              Operational Capacity
              {laborCapacityEnabled && laborCapacity && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  Powered by Labor Capacity
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {laborCapacityEnabled && laborCapacity 
                ? 'Employee-based capacity from your Labor Capacity module.'
                : `Staffing lens for the next ${capacityHorizonLabel}-week horizon.`
              }
            </p>
          </div>
          {laborCapacityEnabled && onNavigateToLaborCapacity ? (
            <button
              type="button"
              onClick={onNavigateToLaborCapacity}
              className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Open Labor Capacity
            </button>
          ) : (
            <button
              type="button"
              onClick={onEditCapacity}
              className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-brand-blue text-sm font-medium text-white hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue"
            >
              Manage Capacity
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Jobs</p>
            <p className="text-2xl font-bold text-brand-blue dark:text-brand-light-blue">{totalActiveJobs}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Future / Pipeline Jobs</p>
            <p className="text-2xl font-bold text-brand-blue dark:text-brand-light-blue">{totalFutureJobs}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Active Jobs per PM</p>
            <p className={`text-2xl font-bold ${pmLoadClass}`}>{avgJobsPerPm.toFixed(1)}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Across {pmCount} project manager{pmCount === 1 ? '' : 's'}</p>
          </div>
          {/* Show Labor Capacity data OR simple capacity data */}
          {laborCapacityEnabled && laborCapacity ? (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Weekly Productive Capacity</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {hoursFormatter.format(laborCapacity.weeklyProductiveHours)} hrs
              </p>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                {laborCapacity.productiveFte} FTE across {laborCapacity.departmentBreakdown.length} productive dept{laborCapacity.departmentBreakdown.length !== 1 ? 's' : ''}
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Weekly Capacity Balance</p>
              <p className={`text-2xl font-bold ${capacityBalanceClass}`}>{hoursFormatter.format(capacityBalance)} hrs</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Available {hoursFormatter.format(totalAvailableCapacity)} hrs • Committed {hoursFormatter.format(totalCommittedCapacity)} hrs</p>
            </div>
          )}
        </div>

        {/* Show Labor Capacity department breakdown OR simple capacity table */}
        {laborCapacityEnabled && laborCapacity ? (
          <div className="space-y-3">
            {laborCapacity.departmentBreakdown.length > 0 && (
              <div className="overflow-x-auto border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <table className="min-w-full divide-y divide-emerald-200 dark:divide-emerald-800 text-sm">
                  <thead className="bg-emerald-50 dark:bg-emerald-900/30">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-emerald-700 dark:text-emerald-400">Productive Department</th>
                      <th className="px-4 py-2 text-right font-semibold text-emerald-700 dark:text-emerald-400">FTE</th>
                      <th className="px-4 py-2 text-right font-semibold text-emerald-700 dark:text-emerald-400">Weekly Hours</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-emerald-100 dark:divide-emerald-900">
                    {laborCapacity.departmentBreakdown.map((dept) => (
                      <tr key={dept.name}>
                        <td className="px-4 py-2 text-left text-gray-700 dark:text-gray-200">{dept.name}</td>
                        <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-200">{dept.fte}</td>
                        <td className="px-4 py-2 text-right font-semibold text-emerald-600 dark:text-emerald-400">{hoursFormatter.format(dept.weeklyHours)} hrs</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>
                Total monthly capacity: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{hoursFormatter.format(laborCapacity.monthlyProductiveHours)} hrs</span>
              </span>
              {laborCapacity.lastUpdated && (
                <span>Data from Labor Capacity module</span>
              )}
            </div>
          </div>
        ) : capacityRows.length > 0 ? (
          <div className="space-y-3">
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/60">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Discipline</th>
                    <th className="px-4 py-2 text-right font-semibold text-gray-600 dark:text-gray-300">Headcount</th>
                    <th className="px-4 py-2 text-right font-semibold text-gray-600 dark:text-gray-300">Hours / Person</th>
                    <th className="px-4 py-2 text-right font-semibold text-gray-600 dark:text-gray-300">Available</th>
                    <th className="px-4 py-2 text-right font-semibold text-gray-600 dark:text-gray-300">Committed</th>
                    <th className="px-4 py-2 text-right font-semibold text-gray-600 dark:text-gray-300">Balance</th>
                    <th className="px-4 py-2 text-right font-semibold text-gray-600 dark:text-gray-300">Utilization</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {capacityRows.map((row) => {
                    const available = row.headcount * row.hoursPerPerson;
                    const balance = available - row.committedHours;
                    const utilization = available > 0 ? (row.committedHours / available) * 100 : 0;
                    const rowBalanceClass = balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
                    const rowUtilClass = utilization <= 100 ? 'text-gray-700 dark:text-gray-200' : 'text-red-600 dark:text-red-400';

                    return (
                      <tr key={row.id}>
                        <td className="px-4 py-2 text-left text-gray-700 dark:text-gray-200">{row.label}</td>
                        <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-200">{headcountFormatter.format(row.headcount)}</td>
                        <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-200">{hoursPerPersonFormatter.format(row.hoursPerPerson)} hrs</td>
                        <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-200">{hoursFormatter.format(available)} hrs</td>
                        <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-200">{hoursFormatter.format(row.committedHours)} hrs</td>
                        <td className={`px-4 py-2 text-right font-semibold ${rowBalanceClass}`}>{hoursFormatter.format(balance)} hrs</td>
                        <td className={`px-4 py-2 text-right font-semibold ${rowUtilClass}`}>{utilization.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Overall utilization: <span className={`font-semibold ${capacityUtilizationClass}`}>{capacityUtilization.toFixed(1)}%</span></span>
              {capacityLastUpdated && (
                <span>Capacity plan last updated {capacityLastUpdated}</span>
              )}
            </div>
            {capacityPlan?.notes && (
              <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-md p-3">
                <span className="font-semibold text-gray-600 dark:text-gray-300 mr-2">Notes:</span>{capacityPlan.notes}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-700/40 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-sm text-gray-500 dark:text-gray-400">
            <p>No staffing capacity has been captured yet. Click the button above to create a plan.</p>
            <button
              type="button"
              onClick={onEditCapacity}
              className="mt-3 inline-flex items-center px-3 py-2 rounded-md border border-brand-blue text-brand-blue hover:bg-brand-blue/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue"
            >
              Add Capacity Plan
            </button>
          </div>
        )}
      </div>

      <div className="space-y-8 p-5">
        {Object.keys(jobsByPm).sort().map(pmName => {
          const pmJobs = jobsByPm[pmName];
          const pmTotalBilling = pmJobs.reduce((acc, job) => acc + job.billingDifference, 0);
          const pmTotalMargin = pmJobs.reduce((acc, job) => acc + job.profitMargin, 0);
          const pmAverageMargin = pmJobs.length > 0 ? pmTotalMargin / pmJobs.length : 0;
          const pmActiveCount = pmJobs.filter(job => job.status === JobStatus.Active).length;
          const pmFutureCount = pmJobs.filter(job => job.status === JobStatus.Future).length;
          const pmTMCount = pmJobs.filter(job => job.isTM).length;

          return (
            <div key={pmName} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700/50 px-4 py-3 border-b dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{pmName}</h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Active: {pmActiveCount} • Future: {pmFutureCount}</span>
                  {pmTMCount > 0 && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">{pmTMCount} T&M</span>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700/20">
                    <tr>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Job Name / No.</th>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Client</th>
                      <th scope="col" className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                      <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Profit Margin</th>
                      <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Billing Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {pmJobs.map(job => (
                      <tr key={job.id}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{job.jobName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">#{job.jobNo}</div>
                          {job.daysOpen !== null && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">{job.daysOpen} days open</div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{job.client}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                            job.isTM 
                              ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                              : 'bg-wip-card text-wip-gold-dark dark:bg-wip-gold/30 dark:text-wip-gold'
                          }`}>
                            {job.isTM ? 'T&M' : 'Fixed'}
                          </span>
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-right text-sm font-semibold ${job.profitMargin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {job.profitMargin.toFixed(1)}%
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-right text-sm font-semibold ${job.billingDifference >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {currencyFormatter.format(Math.abs(job.billingDifference))}
                          <span className="text-xs ml-1">{job.billingDifference >= 0 ? '(Over)' : '(Under)'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                   <tfoot className="bg-gray-100 dark:bg-gray-700/50">
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-right text-sm font-bold text-gray-700 dark:text-gray-200 uppercase">PM Totals</td>
                        <td className={`px-4 py-2 text-right text-sm font-bold ${pmAverageMargin >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                          Avg: {pmAverageMargin.toFixed(1)}%
                        </td>
                        <td className={`px-4 py-2 text-right text-sm font-bold ${pmTotalBilling >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                           {currencyFormatter.format(Math.abs(pmTotalBilling))}
                           <span className="text-xs ml-1">{pmTotalBilling >= 0 ? '(Over)' : '(Under)'}</span>
                        </td>
                      </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CompanyView;
