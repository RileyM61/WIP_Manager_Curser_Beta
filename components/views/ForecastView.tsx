import React from 'react';
import { Job, CostBreakdown, JobStatus } from '../../types';
import InfoTooltip from '../help/InfoTooltip';

interface ForecastViewProps {
  jobs: Job[];
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const sumBreakdown = (breakdown: CostBreakdown): number => breakdown.labor + breakdown.material + breakdown.other;

interface JobForecastMetrics {
  totalContract: number;
  totalOriginalBudget: number;
  totalForecastedBudget: number;
  totalCost: number;
  percentComplete: number;
  earnedRevenue: number;
  costToComplete: number;
  revenueToEarn: number;
  originalProfit: number;
  forecastedProfit: number;
  profitVariance: number;
}

const calculateMetrics = (job: Job): JobForecastMetrics => {
  const totalContract = sumBreakdown(job.contract);
  const totalOriginalBudget = sumBreakdown(job.budget);
  const totalCost = sumBreakdown(job.costs);
  const costToComplete = sumBreakdown(job.costToComplete);

  const totalForecastedBudget = totalCost + costToComplete;

  const percentComplete = totalOriginalBudget > 0 ? totalCost / totalOriginalBudget : 0;
  const earnedRevenue = totalContract * percentComplete;
  const revenueToEarn = totalContract - earnedRevenue;
  
  const originalProfit = totalContract - totalOriginalBudget;
  const forecastedProfit = totalContract - totalForecastedBudget;
  const profitVariance = forecastedProfit - originalProfit;
  
  return {
    totalContract,
    totalOriginalBudget,
    totalForecastedBudget,
    totalCost,
    percentComplete,
    earnedRevenue,
    costToComplete,
    revenueToEarn,
    originalProfit,
    forecastedProfit,
    profitVariance,
  };
};

type ForecastJob = Job & { metrics: JobForecastMetrics };

const isDateTBD = (date?: string): boolean =>
  !date || date === 'TBD';

const toSortableTime = (job: Job): number => {
  // Prefer contractual end date, fall back to target end date.
  const candidate = !isDateTBD(job.endDate) ? job.endDate : (!isDateTBD(job.targetEndDate) ? job.targetEndDate : undefined);
  if (!candidate) return Number.POSITIVE_INFINITY;
  const t = new Date(candidate).getTime();
  return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
};

const sortByScheduleThenName = (a: ForecastJob, b: ForecastJob): number => {
  const diff = toSortableTime(a) - toSortableTime(b);
  if (diff !== 0) return diff;
  // Stable tie-breakers
  const nameDiff = (a.jobName || '').localeCompare(b.jobName || '');
  if (nameDiff !== 0) return nameDiff;
  return (a.jobNo || '').localeCompare(b.jobNo || '');
};

const ForecastView: React.FC<ForecastViewProps> = ({ jobs }) => {
  
  const forecastJobsAll: ForecastJob[] = jobs
    .filter(job => job.status === JobStatus.Active || job.status === JobStatus.Future)
    .map(job => ({ ...job, metrics: calculateMetrics(job) }))
    .sort(sortByScheduleThenName);

  // Split into scheduled vs unscheduled (TBD) for time-phased readability.
  // IMPORTANT: totals still include BOTH.
  const scheduledJobs = forecastJobsAll.filter(j => Number.isFinite(toSortableTime(j)) && toSortableTime(j) !== Number.POSITIVE_INFINITY);
  const unscheduledJobs = forecastJobsAll.filter(j => !scheduledJobs.includes(j));

  const totals = forecastJobsAll.reduce((acc, job) => {
    acc.totalContract += job.metrics.totalContract;
    acc.revenueToEarn += job.metrics.revenueToEarn;
    acc.costToComplete += job.metrics.costToComplete;
    acc.forecastedProfit += job.metrics.forecastedProfit;
    return acc;
  }, {
    totalContract: 0,
    revenueToEarn: 0, // This is our backlog
    costToComplete: 0,
    forecastedProfit: 0,
  });

  const totalForecastedProfitMargin = totals.totalContract > 0 ? (totals.forecastedProfit / totals.totalContract) * 100 : 0;

  if (forecastJobsAll.length === 0) {
    return <div className="text-center py-16 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg shadow-sm">No Active or Future jobs to forecast.</div>;
  }

  const unscheduledTotals = unscheduledJobs.reduce((acc, job) => {
    acc.revenueToEarn += job.metrics.revenueToEarn;
    acc.costToComplete += job.metrics.costToComplete;
    acc.forecastedProfit += job.metrics.forecastedProfit;
    return acc;
  }, {
    revenueToEarn: 0,
    costToComplete: 0,
    forecastedProfit: 0,
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-brand-blue dark:text-brand-light-blue">Financial Forecast</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Projection based on active and future jobs, using estimated cost to complete.</p>
        {unscheduledJobs.length > 0 && (
          <div className="mt-3 text-xs text-wip-gold-dark dark:text-wip-gold bg-wip-card dark:bg-wip-gold/20 border border-wip-border dark:border-wip-gold/50 rounded-lg p-3">
            <div className="font-semibold">
              {unscheduledJobs.length} job{unscheduledJobs.length === 1 ? '' : 's'} missing an End Date / Target Date (TBD)
            </div>
            <div className="mt-1">
              These jobs are included in totals, but shown under <span className="font-semibold">Unscheduled</span> since they can’t be time-phased.
              Unscheduled backlog: <span className="font-semibold">{currencyFormatter.format(unscheduledTotals.revenueToEarn)}</span>.
            </div>
          </div>
        )}
      </div>

      <div className="p-5 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Company-Wide Forecast Summary</h3>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Backlog (Revenue to Earn)</p>
              <InfoTooltip
                title="Backlog (Revenue to Earn)"
                shortText="The remaining contract value yet to be earned across all active and future jobs."
                detailedText="Backlog represents the total revenue you have under contract but haven't yet earned. It's calculated by taking each job's total contract value and subtracting the revenue already earned (based on percent complete). This is your pipeline of committed future revenue and a key indicator of business health."
                formula="Backlog = Σ (Contract Value − Earned Revenue)"
                example="If a job has a $500,000 contract and you're 60% complete:\nEarned Revenue = $500,000 × 60% = $300,000\nBacklog = $500,000 − $300,000 = $200,000\n\nSum this across all jobs for total backlog."
              />
            </div>
            <p className="text-2xl font-bold text-brand-blue dark:text-brand-light-blue">
              {currencyFormatter.format(totals.revenueToEarn)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Est. Cost to Complete</p>
              <InfoTooltip
                title="Estimated Cost to Complete"
                shortText="The total estimated costs remaining to finish all active and future jobs."
                detailedText="Cost to Complete is your project team's estimate of the remaining labor, material, and other costs needed to finish each job. This is a forward-looking estimate that should be updated regularly as work progresses. Accurate cost to complete estimates are essential for reliable profit forecasting."
                formula="Cost to Complete = Σ (Labor CTC + Material CTC + Other CTC)"
                example="For a job with:\n• Labor remaining: $50,000\n• Materials to purchase: $30,000\n• Other costs: $10,000\n\nCost to Complete = $90,000\n\nSum across all jobs for total."
              />
            </div>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {currencyFormatter.format(totals.costToComplete)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Forecasted Profit</p>
              <InfoTooltip
                title="Total Forecasted Profit"
                shortText="The expected profit when all jobs are complete, based on current cost estimates."
                detailedText="Forecasted Profit is what you expect to earn after all costs are paid. It's calculated by taking the total contract value and subtracting both costs already incurred and estimated costs to complete. This number will change as your cost estimates are updated throughout the project lifecycle."
                formula="Forecasted Profit = Contract Value − (Costs Incurred + Cost to Complete)"
                example="For a $500,000 contract job:\n• Costs incurred to date: $250,000\n• Cost to complete: $180,000\n• Total forecasted cost: $430,000\n\nForecasted Profit = $500,000 − $430,000 = $70,000\nProfit Margin = $70,000 ÷ $500,000 = 14%"
              />
            </div>
            <p className={`text-2xl font-bold ${totals.forecastedProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {currencyFormatter.format(totals.forecastedProfit)}
            </p>
            <p className={`text-xs font-semibold ${totalForecastedProfitMargin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              ({totalForecastedProfitMargin.toFixed(1)}% Margin)
            </p>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Job Name / PM</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contract Value</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Backlog</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cost to Complete</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Original Profit</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Forecasted Profit</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Variance</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Target Profit</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vs Target</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {scheduledJobs.map(job => (
              <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{job.jobName}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{job.projectManager}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                  {currencyFormatter.format(job.metrics.totalContract)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-brand-blue dark:text-brand-light-blue">
                  {currencyFormatter.format(job.metrics.revenueToEarn)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                  {currencyFormatter.format(job.metrics.costToComplete)}
                </td>
                 <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                  {currencyFormatter.format(job.metrics.originalProfit)}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-semibold ${job.metrics.forecastedProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {currencyFormatter.format(job.metrics.forecastedProfit)}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-bold ${job.metrics.profitVariance > 0 ? 'text-green-600 dark:text-green-400' : job.metrics.profitVariance < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {currencyFormatter.format(job.metrics.profitVariance)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                  {typeof job.targetProfit === 'number' ? currencyFormatter.format(job.targetProfit) : '—'}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-semibold ${typeof job.targetProfit === 'number' ? (job.metrics.forecastedProfit - job.targetProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400') : 'text-gray-500 dark:text-gray-400'}`}>
                  {typeof job.targetProfit === 'number' ? currencyFormatter.format(job.metrics.forecastedProfit - job.targetProfit) : '—'}
                </td>
              </tr>
            ))}
            {unscheduledJobs.length > 0 && (
              <>
                <tr className="bg-gray-50 dark:bg-gray-700/30">
                  <td colSpan={9} className="px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Unscheduled (TBD dates)
                    <span className="ml-2 normal-case font-normal text-gray-500 dark:text-gray-400">
                      {unscheduledJobs.length} job{unscheduledJobs.length === 1 ? '' : 's'} • Backlog {currencyFormatter.format(unscheduledTotals.revenueToEarn)}
                    </span>
                  </td>
                </tr>
                {unscheduledJobs.map(job => (
                  <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{job.jobName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {job.projectManager} • End date: <span className="font-semibold">TBD</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                      {currencyFormatter.format(job.metrics.totalContract)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-brand-blue dark:text-brand-light-blue">
                      {currencyFormatter.format(job.metrics.revenueToEarn)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                      {currencyFormatter.format(job.metrics.costToComplete)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                      {currencyFormatter.format(job.metrics.originalProfit)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-semibold ${job.metrics.forecastedProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {currencyFormatter.format(job.metrics.forecastedProfit)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-bold ${job.metrics.profitVariance > 0 ? 'text-green-600 dark:text-green-400' : job.metrics.profitVariance < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {currencyFormatter.format(job.metrics.profitVariance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                      {typeof job.targetProfit === 'number' ? currencyFormatter.format(job.targetProfit) : '—'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-semibold ${typeof job.targetProfit === 'number' ? (job.metrics.forecastedProfit - job.targetProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400') : 'text-gray-500 dark:text-gray-400'}`}>
                      {typeof job.targetProfit === 'number' ? currencyFormatter.format(job.metrics.forecastedProfit - job.targetProfit) : '—'}
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ForecastView;