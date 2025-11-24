import React from 'react';
import { Job, CostBreakdown, JobStatus, JobsSnapshot, CapacityPlan, CapacityRow } from '../../types';

interface CompanyViewProps {
  jobs: Job[];
  snapshot: JobsSnapshot | null;
  projectManagers: string[];
  capacityPlan?: CapacityPlan | null;
  capacityEnabled: boolean;
  onEditCapacity: () => void;
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

const sumBreakdown = (breakdown: CostBreakdown): number => breakdown.labor + breakdown.material + breakdown.other;

const calculateTotalEarnedRevenue = (jobList: Job[]): number => {
  if (!jobList) return 0;
  return jobList.reduce((total, job) => {
    const totalContract = sumBreakdown(job.contract);
    const totalBudget = sumBreakdown(job.budget);
    const totalCost = sumBreakdown(job.costs);
    
    if (totalBudget <= 0) return total;
    
    const percentComplete = totalCost / totalBudget;
    const earnedRevenue = totalContract * percentComplete;
    return total + earnedRevenue;
  }, 0);
};

const CompanyView: React.FC<CompanyViewProps> = ({ jobs, snapshot, projectManagers, capacityPlan, capacityEnabled, onEditCapacity }) => {
  
  const jobsWithMetrics = jobs.map(job => {
    const totalContract = sumBreakdown(job.contract);
    const totalBudget = sumBreakdown(job.budget);
    const totalCost = sumBreakdown(job.costs);
    const totalInvoiced = sumBreakdown(job.invoiced);

    const profitMargin = totalContract > 0 ? ((totalContract - totalBudget) / totalContract) * 100 : 0;
    
    const overallPercentComplete = totalBudget > 0 ? totalCost / totalBudget : 0;
    const totalEarnedRevenue = totalContract * overallPercentComplete;
    const billingDifference = totalInvoiced - totalEarnedRevenue;

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

    return { ...job, profitMargin, billingDifference, daysOpen };
  });

  const backlogToEarn = jobs.reduce((acc, job) => {
    const totalContract = sumBreakdown(job.contract);
    const totalBudget = sumBreakdown(job.budget);
    const totalCost = sumBreakdown(job.costs);
    if (totalBudget <= 0) {
      return acc + totalContract;
    }
    const percentComplete = totalCost / totalBudget;
    const earnedRevenue = totalContract * percentComplete;
    const remainingRevenue = Math.max(totalContract - earnedRevenue, 0);
    return acc + remainingRevenue;
  }, 0);

  const jobsByPm = jobsWithMetrics.reduce((acc, job) => {
    const pm = job.projectManager || 'Unassigned';
    if (!acc[pm]) {
      acc[pm] = [];
    }
    acc[pm].push(job);
    return acc;
  }, {} as Record<string, (Job & { profitMargin: number; billingDifference: number; daysOpen: number | null; })[]>);

  const totalNetBillingDifference = jobsWithMetrics.reduce((acc, job) => acc + job.billingDifference, 0);
  const totalProfitMargin = jobsWithMetrics.reduce((acc, job) => acc + job.profitMargin, 0);
  const averageProfitMargin = jobsWithMetrics.length > 0 ? totalProfitMargin / jobsWithMetrics.length : 0;

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
          </div>
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Net Billing Status</p>
            <p className={`text-2xl font-bold ${totalNetBillingDifference >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {currencyFormatter.format(Math.abs(totalNetBillingDifference))}
            </p>
            <p className={`text-xs font-semibold ${totalNetBillingDifference >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              ({totalNetBillingDifference >= 0 ? 'Over Billed' : 'Under Billed'})
            </p>
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
        </div>
      </div>

      <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Operational Capacity</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Staffing lens for the next {capacityHorizonLabel}-week horizon.</p>
          </div>
          {capacityEnabled ? (
            <button
              type="button"
              onClick={onEditCapacity}
              className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-brand-blue text-sm font-medium text-white hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue"
            >
              Manage Capacity
            </button>
          ) : (
            <button
              type="button"
              onClick={onEditCapacity}
              className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-dashed border-gray-400 text-sm font-medium text-gray-500 dark:text-gray-300"
            >
              Enable in Settings
            </button>
          )}
        </div>

        {capacityEnabled ? (
        <>
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
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Weekly Capacity Balance</p>
            <p className={`text-2xl font-bold ${capacityBalanceClass}`}>{hoursFormatter.format(capacityBalance)} hrs</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Available {hoursFormatter.format(totalAvailableCapacity)} hrs • Committed {hoursFormatter.format(totalCommittedCapacity)} hrs</p>
          </div>
        </div>

        {capacityRows.length > 0 ? (
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
            {capacityPlan.notes && (
              <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-md p-3">
                <span className="font-semibold text-gray-600 dark:text-gray-300 mr-2">Notes:</span>{capacityPlan.notes}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-700/40 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-sm text-gray-500 dark:text-gray-400">
            <p>No staffing capacity has been captured yet. Use the button above to create a plan.</p>
            <button
              type="button"
              onClick={onEditCapacity}
              className="mt-3 inline-flex items-center px-3 py-2 rounded-md border border-brand-blue text-brand-blue hover:bg-brand-blue/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue"
            >
              Add Capacity Plan
            </button>
          </div>
        )}
        </>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-700/40 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-sm text-gray-500 dark:text-gray-400">
            <p>This workspace isn’t tracking staffing capacity yet.</p>
            <p className="mt-2">Enable capacity tracking in Settings to forecast headcount, labor hours, and weekly utilization.</p>
            <button
              type="button"
              onClick={onEditCapacity}
              className="mt-4 inline-flex items-center px-4 py-2 rounded-md border border-brand-blue text-brand-blue hover:bg-brand-blue/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue"
            >
              Open Settings
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

          return (
            <div key={pmName} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700/50 px-4 py-3 border-b dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{pmName}</h3>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Active: {pmActiveCount} • Future: {pmFutureCount}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700/20">
                    <tr>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Job Name / No.</th>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Client</th>
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
                        <td colSpan={2} className="px-4 py-2 text-right text-sm font-bold text-gray-700 dark:text-gray-200 uppercase">PM Totals</td>
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