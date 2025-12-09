import React from 'react';
import { Job, JobStatus, UserRole } from '../../../types';
import ProgressBar from '../../../components/ui/ProgressBar';
import { EditIcon, ChatBubbleLeftTextIcon, ClockIcon } from '../../../components/shared/icons';
import { sumBreakdown, calculateEarnedRevenue, calculateBillingDifference, calculateForecastedProfit, getAllScheduleWarnings } from '../lib/jobCalculations';

interface JobTableProps {
  jobs: Job[];
  onEdit: (job: Job) => void;
  onOpenNotes: (job: Job) => void;
  userRole: UserRole;
  focusMode: 'default' | 'pm-at-risk' | 'pm-late';
  activeEstimator?: string;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const calculateProgress = (cost: number, costToComplete: number): number => {
  const forecastedBudget = cost + costToComplete;
  if (forecastedBudget === 0) return 0;
  const percentage = (cost / forecastedBudget) * 100;
  return Math.round(percentage);
};


const JobTable: React.FC<JobTableProps> = ({ jobs, onEdit, onOpenNotes, userRole, focusMode, activeEstimator }) => {
  if (jobs.length === 0) {
    return <div className="text-center py-16 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg shadow-sm">No jobs found for this category.</div>
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Job Name / No.</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Client</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">PM</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dates</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Financials</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">% Complete</th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {jobs.map((job) => {
            const isTM = job.jobType === 'time-material';
            const totalOriginalBudget = sumBreakdown(job.budget);
            const totalCost = sumBreakdown(job.costs);
            const totalContract = sumBreakdown(job.contract);
            const totalInvoiced = sumBreakdown(job.invoiced);
            const totalCostToComplete = sumBreakdown(job.costToComplete);

            // Use shared calculation functions
            const earnedRevenue = calculateEarnedRevenue(job);
            const billingInfo = calculateBillingDifference(job);
            const forecastedProfit = calculateForecastedProfit(job);

            const totalForecastedBudget = totalCost + totalCostToComplete;

            const originalProfit = totalContract - totalOriginalBudget;
            const originalProfitMargin = totalContract > 0 ? (originalProfit / totalContract) * 100 : 0;

            // For T&M, profit margin is based on earned revenue
            const forecastedProfitMargin = isTM
              ? (earnedRevenue.total > 0 ? (forecastedProfit / earnedRevenue.total) * 100 : 0)
              : (totalContract > 0 ? (forecastedProfit / totalContract) * 100 : 0);

            const profitVariance = isTM ? forecastedProfit : (forecastedProfit - originalProfit);
            const budgetVariance = totalForecastedBudget - totalOriginalBudget;
            const budgetVarianceColor = budgetVariance > 0 ? 'text-red-600 dark:text-red-500' : budgetVariance < 0 ? 'text-green-600 dark:text-green-500' : 'text-gray-800 dark:text-gray-200';

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

            let daysOnHold: number | null = null;
            if (job.status === JobStatus.OnHold && job.onHoldDate) {
              const onHoldDate = new Date(job.onHoldDate);
              const today = new Date();
              if (today > onHoldDate) {
                daysOnHold = Math.floor((today.getTime() - onHoldDate.getTime()) / (1000 * 60 * 60 * 24));
              } else {
                daysOnHold = 0;
              }
            }

            const targetVariance = typeof job.targetProfit === 'number' ? forecastedProfit - job.targetProfit : null;
            const isMarginRisk = targetVariance !== null && targetVariance < 0;
            const targetEndDateDisplay = job.targetEndDate ? (job.targetEndDate === 'TBD' ? 'TBD' : new Date(job.targetEndDate).toLocaleDateString()) : '—';

            // Get all schedule warnings (mobilization + target date)
            const scheduleWarnings = getAllScheduleWarnings(job);
            const hasScheduleWarning = scheduleWarnings.length > 0;
            const hasCriticalWarning = scheduleWarnings.some(w => w.severity === 'critical');

            // Estimators can only edit Future or Draft jobs
            const isEstimatorWithRestrictedAccess = userRole === 'estimator' && job.status !== JobStatus.Future && job.status !== JobStatus.Draft;

            const rowHighlightClass =
              focusMode === 'pm-at-risk' && isMarginRisk
                ? 'ring-1 ring-red-400 dark:ring-red-500'
                : focusMode === 'pm-late' && hasScheduleWarning
                  ? hasCriticalWarning
                    ? 'ring-1 ring-red-400 dark:ring-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'ring-1 ring-yellow-400 dark:ring-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                  : '';

            return (
              <tr key={job.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${rowHighlightClass}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{job.jobName}</span>
                    {hasScheduleWarning && (
                      <span
                        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${hasCriticalWarning
                            ? 'bg-red-500 text-white'
                            : 'bg-amber-400 text-amber-900'
                          }`}
                        title={scheduleWarnings.map(w => w.message).join('\n')}
                      >
                        !
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">#{job.jobNo}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${job.status === JobStatus.Draft ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-dashed border-slate-400' :
                        job.status === JobStatus.Future ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
                          job.status === JobStatus.Active ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                            job.status === JobStatus.OnHold ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                              job.status === JobStatus.Completed ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                      }`}>
                      {job.status}
                    </span>
                    <span className={`px-2 inline-flex text-xs leading-5 font-medium rounded ${isTM
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                      }`}>
                      {isTM ? 'T&M' : 'Fixed'}
                    </span>
                  </div>
                  {job.lastUpdated && (
                    <div className="mt-1 flex items-center text-xs text-gray-400 dark:text-gray-500">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      <span>Updated: {new Date(job.lastUpdated).toLocaleDateString()}</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{job.client}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <div>{job.projectManager}</div>
                  {job.estimator && (
                    <div className="text-xs text-gray-400 dark:text-gray-500">Est: {job.estimator}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <div>Start: {job.startDate === 'TBD' ? 'TBD' : new Date(job.startDate).toLocaleDateString()}</div>
                  <div>End: {job.endDate === 'TBD' ? 'TBD' : new Date(job.endDate).toLocaleDateString()}</div>
                  {!isTM && userRole === 'projectManager' && job.targetEndDate && (
                    <div className={`text-xs font-semibold mt-1 ${hasScheduleWarning ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      Target: {targetEndDateDisplay}
                    </div>
                  )}
                  {daysOpen !== null && (
                    <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1">({daysOpen} days open)</div>
                  )}
                  {daysOnHold !== null && (
                    <div className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 mt-1">({daysOnHold} days on hold)</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <div className="space-y-2">
                    {/* T&M vs Fixed Price financials */}
                    {isTM ? (
                      <>
                        <div><span className="font-semibold text-gray-700 dark:text-gray-300">Costs: </span>{currencyFormatter.format(totalCost)}</div>
                        <div><span className="font-semibold text-gray-700 dark:text-gray-300">Earned Rev: </span><span className="text-green-600 dark:text-green-400">{currencyFormatter.format(earnedRevenue.total)}</span></div>
                        <div><span className="font-semibold text-gray-700 dark:text-gray-300">Invoiced: </span>{currencyFormatter.format(totalInvoiced)}</div>
                        {billingInfo.difference !== 0 && (
                          <div className={`text-xs font-semibold ${billingInfo.isOverBilled ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                            <span>{billingInfo.label}: </span>{currencyFormatter.format(Math.abs(billingInfo.difference))}
                          </div>
                        )}
                        <div className="pt-1 border-t dark:border-gray-600">
                          <div className="grid grid-cols-2 gap-x-2 text-xs">
                            <span className="font-semibold text-gray-600 dark:text-gray-300">Profit:</span>
                            <span className={`font-bold ${forecastedProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {currencyFormatter.format(forecastedProfit)}
                            </span>
                            <span className="font-semibold text-gray-600 dark:text-gray-300">Margin:</span>
                            <span className={`font-bold ${forecastedProfitMargin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {forecastedProfitMargin.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        {job.tmSettings?.laborBillingType === 'fixed-rate' && job.tmSettings.laborHours && (
                          <div className="pt-1 border-t dark:border-gray-600 text-xs text-blue-600 dark:text-blue-400">
                            {job.tmSettings.laborHours} hrs @ ${job.tmSettings.laborBillRate}/hr
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div><span className="font-semibold text-gray-700 dark:text-gray-300">Contract: </span>{currencyFormatter.format(totalContract)}</div>
                        <div><span className="font-semibold text-gray-700 dark:text-gray-300">Invoiced: </span>{currencyFormatter.format(totalInvoiced)}</div>
                        <div><span className="font-semibold text-gray-700 dark:text-gray-300">Earned Rev: </span>{currencyFormatter.format(earnedRevenue.total)}</div>
                        {billingInfo.difference !== 0 && (
                          <div className={`text-xs font-semibold ${billingInfo.isOverBilled ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                            <span>{billingInfo.label}: </span>{currencyFormatter.format(Math.abs(billingInfo.difference))}
                          </div>
                        )}
                        {userRole === 'projectManager' && (
                          <div className="pt-1 border-t dark:border-gray-600">
                            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Targets</p>
                            <div className="grid grid-cols-2 gap-x-2 text-xs">
                              <span className="font-semibold text-gray-600 dark:text-gray-300">Target Profit:</span>
                              <span>{typeof job.targetProfit === 'number' ? currencyFormatter.format(job.targetProfit) : '—'}</span>
                              <span className="font-semibold text-gray-600 dark:text-gray-300">Target Margin:</span>
                              <span>{job.targetMargin !== undefined ? `${job.targetMargin.toFixed(1)}%` : '—'}</span>
                              <span className="font-semibold text-gray-600 dark:text-gray-300">Variance:</span>
                              <span className={`font-bold ${targetVariance !== null ? (targetVariance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400') : 'text-gray-500 dark:text-gray-400'}`}>
                                {targetVariance !== null ? currencyFormatter.format(targetVariance) : '—'}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="pt-1 border-t dark:border-gray-600">
                          <div className="grid grid-cols-2 gap-x-2 text-xs">
                            <span className="font-semibold text-gray-600 dark:text-gray-300">Orig. Margin:</span><span className={`${originalProfit >= 0 ? 'text-gray-700 dark:text-gray-300' : 'text-red-700 dark:text-red-400'}`}>{originalProfitMargin.toFixed(1)}%</span>
                            <span className="font-semibold text-gray-600 dark:text-gray-300">Fcst. Margin:</span><span className={`font-bold ${forecastedProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{forecastedProfitMargin.toFixed(1)}%</span>
                            <span className="font-semibold text-gray-600 dark:text-gray-300">Profit Var:</span><span className={`font-bold ${profitVariance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{currencyFormatter.format(profitVariance)}</span>
                          </div>
                        </div>

                        <div className="pt-1 border-t dark:border-gray-600">
                          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Cost Summary</p>
                          <div className="grid grid-cols-2 gap-x-2 text-xs">
                            <span className="font-semibold text-gray-600 dark:text-gray-300">Cost to Date:</span><span>{currencyFormatter.format(totalCost)}</span>
                            <span className="font-semibold text-gray-600 dark:text-gray-300">Orig. Budget:</span><span className="text-gray-500 dark:text-gray-400">{currencyFormatter.format(totalOriginalBudget)}</span>
                            <span className="font-semibold text-gray-600 dark:text-gray-300">Fcst. Budget:</span>
                            <span className={`font-bold ${budgetVarianceColor}`}>
                              {currencyFormatter.format(totalForecastedBudget)}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {isTM ? (
                    <div className="text-xs text-gray-400 dark:text-gray-500 italic">N/A for T&M</div>
                  ) : (
                    <div className="w-40 space-y-2">
                      <ProgressBar label="Labor" percentage={calculateProgress(job.costs.labor, job.costToComplete.labor)} />
                      <ProgressBar label="Material" percentage={calculateProgress(job.costs.material, job.costToComplete.material)} />
                      <ProgressBar label="Other" percentage={calculateProgress(job.costs.other, job.costToComplete.other)} />
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-4">
                    <button onClick={() => onOpenNotes(job)} className="relative text-gray-500 dark:text-gray-400 hover:text-brand-blue dark:hover:text-white" title="View/Add Notes">
                      <ChatBubbleLeftTextIcon />
                      {job.notes && job.notes.length > 0 && (
                        <span className="absolute -top-1 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                          {job.notes.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => onEdit(job)}
                      className={`${isEstimatorWithRestrictedAccess
                          ? 'text-gray-400 dark:text-gray-500'
                          : 'text-brand-light-blue hover:text-brand-blue dark:hover:text-blue-400'
                        }`}
                      title={isEstimatorWithRestrictedAccess ? 'View Job' : 'Edit Job'}
                    >
                      <EditIcon />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default JobTable;

