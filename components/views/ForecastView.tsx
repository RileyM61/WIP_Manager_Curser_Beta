import React from 'react';
import { Job, CostBreakdown, JobStatus } from '../../types';

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


const ForecastView: React.FC<ForecastViewProps> = ({ jobs }) => {
  
  const forecastJobs = jobs
    .filter(job => job.status === JobStatus.Active || job.status === JobStatus.Future)
    .map(job => ({ ...job, metrics: calculateMetrics(job) }))
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());

  const totals = forecastJobs.reduce((acc, job) => {
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

  if (forecastJobs.length === 0) {
    return <div className="text-center py-16 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg shadow-sm">No Active or Future jobs to forecast.</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-brand-blue dark:text-brand-light-blue">Financial Forecast</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Projection based on active and future jobs, using estimated cost to complete.</p>
      </div>

      <div className="p-5 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Company-Wide Forecast Summary</h3>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Backlog (Revenue to Earn)</p>
            <p className="text-2xl font-bold text-brand-blue dark:text-brand-light-blue">
              {currencyFormatter.format(totals.revenueToEarn)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Est. Cost to Complete</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {currencyFormatter.format(totals.costToComplete)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Forecasted Profit</p>
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
            {forecastJobs.map(job => (
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
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ForecastView;