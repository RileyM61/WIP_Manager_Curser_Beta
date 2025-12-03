import React from 'react';
import { Job, JobStatus, UserRole, SortKey, SortDirection, InlineFinanceUpdate } from '../../../types';
import CurrencyInput from '../../../components/shared/CurrencyInput';
import { EditIcon, ChatBubbleLeftTextIcon, ClockIcon, ChevronUpIcon, ChevronDownIcon } from '../../../components/shared/icons';
import { sumBreakdown, calculateEarnedRevenue, calculateBillingDifference, calculateForecastedProfit, getAllScheduleWarnings } from '../lib/jobCalculations';

interface JobTableProps {
  jobs: Job[];
  onEdit: (job: Job) => void;
  onOpenNotes: (job: Job) => void;
  userRole: UserRole;
  focusMode: 'default' | 'pm-at-risk' | 'pm-late';
  activeEstimator?: string;
  onQuickUpdate: (jobId: string, update: InlineFinanceUpdate) => Promise<void> | void;
  inlineSaving?: Record<string, boolean>;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSortChange: (key: SortKey) => void;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const JobTable: React.FC<JobTableProps> = ({
  jobs,
  onEdit,
  onOpenNotes,
  userRole,
  focusMode,
  activeEstimator,
  onQuickUpdate,
  inlineSaving,
  sortKey,
  sortDirection,
  onSortChange,
}) => {
  const SortHeaderButton = ({ label, field }: { label: string; field: SortKey }) => {
    const isActive = sortKey === field;
    return (
      <button
        type="button"
        onClick={() => onSortChange(field)}
        className="flex items-center gap-1 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
      >
        <span>{label}</span>
        {isActive ? (
          sortDirection === 'asc' ? (
            <ChevronUpIcon className="w-3 h-3" />
          ) : (
            <ChevronDownIcon className="w-3 h-3" />
          )
        ) : (
          <span className="w-3 h-3 opacity-0">
            <ChevronUpIcon className="w-3 h-3" />
          </span>
        )}
      </button>
    );
  };

  const isSavingField = (key: string) => (inlineSaving ? inlineSaving[key] : false);

   if (jobs.length === 0) {
    return <div className="text-center py-16 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg shadow-sm">No jobs found for this category.</div>
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            <th scope="col" className="px-6 py-3">
              <SortHeaderButton label="Job" field="jobName" />
            </th>
            <th scope="col" className="px-4 py-3">
              <SortHeaderButton label="Job #" field="jobNo" />
            </th>
            <th scope="col" className="px-4 py-3">
              <SortHeaderButton label="Client" field="client" />
            </th>
            <th scope="col" className="px-4 py-3">
              <SortHeaderButton label="Project Manager" field="projectManager" />
            </th>
            <th scope="col" className="px-4 py-3">
              <SortHeaderButton label="Status" field="status" />
            </th>
            <th scope="col" className="px-4 py-3">
              <SortHeaderButton label="Schedule" field="startDate" />
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Weekly Update
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Health Snapshot
            </th>
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

            // Estimators can only edit Future jobs
            const isEstimatorWithRestrictedAccess = userRole === 'estimator' && job.status !== JobStatus.Future;

            const rowHighlightClass =
              focusMode === 'pm-at-risk' && isMarginRisk
                ? 'ring-1 ring-red-400 dark:ring-red-500'
                : focusMode === 'pm-late' && hasScheduleWarning
                  ? hasCriticalWarning 
                    ? 'ring-1 ring-red-400 dark:ring-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'ring-1 ring-yellow-400 dark:ring-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                  : '';
            
            const canInlineEdit = !isEstimatorWithRestrictedAccess;
            const weeklyInputClass =
              'block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-1.5 px-2 text-sm text-right font-semibold text-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent';

            return (
              <tr key={job.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${rowHighlightClass}`}>
                <td className="px-6 py-4 align-top">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{job.jobName}</span>
                    {hasScheduleWarning && (
                      <span
                        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                          hasCriticalWarning
                            ? 'bg-red-500 text-white'
                            : 'bg-amber-400 text-amber-900'
                        }`}
                        title={scheduleWarnings.map(w => w.message).join('\n')}
                      >
                        !
                      </span>
                    )}
                  </div>
                  <div className="inline-flex items-center gap-2 mt-2">
                    <span className={`px-2 inline-flex text-xs leading-5 font-medium rounded ${
                      isTM
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                    }`}>
                      {isTM ? 'Time & Material' : 'Fixed Price'}
                    </span>
                  </div>
                  {job.lastUpdated && (
                    <div className="mt-2 flex items-center text-xs text-gray-400 dark:text-gray-500">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      <span>Updated {new Date(job.lastUpdated).toLocaleDateString()}</span>
                    </div>
                  )}
                </td>

                <td className="px-4 py-4 align-top text-sm text-gray-600 dark:text-gray-300 font-mono">
                  #{job.jobNo}
                </td>

                <td className="px-4 py-4 align-top text-sm text-gray-700 dark:text-gray-300">
                  <div className="font-medium">{job.client}</div>
                </td>

                <td className="px-4 py-4 align-top text-sm text-gray-700 dark:text-gray-300">
                  <div>{job.projectManager}</div>
                  {job.estimator && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Estimator: {job.estimator}</div>
                  )}
                </td>

                <td className="px-4 py-4 align-top text-sm text-gray-700 dark:text-gray-300">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                    job.status === JobStatus.Future ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200' :
                    job.status === JobStatus.Active ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' :
                    job.status === JobStatus.OnHold ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200' :
                    job.status === JobStatus.Completed ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200'
                  }`}>
                    {job.status}
                  </span>
                  {job.asOfDate && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      As of {new Date(job.asOfDate).toLocaleDateString()}
                    </div>
                  )}
                </td>

                <td className="px-4 py-4 align-top text-sm text-gray-600 dark:text-gray-300">
                  <div>Start: {job.startDate === 'TBD' ? 'TBD' : new Date(job.startDate).toLocaleDateString()}</div>
                  <div>End: {job.endDate === 'TBD' ? 'TBD' : new Date(job.endDate).toLocaleDateString()}</div>
                  {!isTM && userRole === 'projectManager' && job.targetEndDate && (
                    <div className={`text-xs font-semibold mt-1 ${hasScheduleWarning ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      Target: {targetEndDateDisplay}
                    </div>
                  )}
                  {daysOpen !== null && (
                    <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1">
                      {daysOpen} days open
                    </div>
                  )}
                  {daysOnHold !== null && (
                    <div className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 mt-1">
                      {daysOnHold} days on hold
                    </div>
                  )}
                </td>

                <td className="px-6 py-4 align-top text-sm text-gray-700 dark:text-gray-200">
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">Invoiced to Date</div>
                      <div className="grid grid-cols-3 gap-2 mt-1 text-[10px] font-semibold uppercase text-gray-400 dark:text-gray-500">
                        <span>Labor</span>
                        <span>Material</span>
                        <span>Other</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {(['labor', 'material', 'other'] as const).map((key) => (
                          <CurrencyInput
                            key={`${job.id}-inv-${key}`}
                            id={`invoiced-${job.id}-${key}`}
                            name={`invoiced.${key}`}
                            value={job.invoiced[key]}
                            onChange={(_, value) => {
                              if (!canInlineEdit) return;
                              onQuickUpdate(job.id, {
                                type: 'component',
                                field: 'invoiced',
                                key,
                                value,
                              });
                            }}
                            disabled={!canInlineEdit || isSavingField(`${job.id}-invoiced-${key}`)}
                            className={`${weeklyInputClass} text-xs`}
                          />
                        ))}
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <span>Total {currencyFormatter.format(totalInvoiced)}</span>
                        {(['labor', 'material', 'other'] as const).some((key) =>
                          isSavingField(`${job.id}-invoiced-${key}`)
                        ) && <span className="text-orange-500">Saving…</span>}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">Costs to Date</div>
                      <div className="grid grid-cols-3 gap-2 mt-1 text-[10px] font-semibold uppercase text-gray-400 dark:text-gray-500">
                        <span>Labor</span>
                        <span>Material</span>
                        <span>Other</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {(['labor', 'material', 'other'] as const).map((key) => (
                          <CurrencyInput
                            key={`${job.id}-cost-${key}`}
                            id={`costs-${job.id}-${key}`}
                            name={`costs.${key}`}
                            value={job.costs[key]}
                            onChange={(_, value) => {
                              if (!canInlineEdit) return;
                              onQuickUpdate(job.id, {
                                type: 'component',
                                field: 'costs',
                                key,
                                value,
                              });
                            }}
                            disabled={!canInlineEdit || isSavingField(`${job.id}-costs-${key}`)}
                            className={`${weeklyInputClass} text-xs`}
                          />
                        ))}
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <span>Total {currencyFormatter.format(totalCost)}</span>
                        {(['labor', 'material', 'other'] as const).some((key) =>
                          isSavingField(`${job.id}-costs-${key}`)
                        ) && <span className="text-orange-500">Saving…</span>}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">Cost to Complete</div>
                      {isTM ? (
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic">Not tracked for T&M</div>
                      ) : (
                        <>
                          <div className="grid grid-cols-3 gap-2 mt-1 text-[10px] font-semibold uppercase text-gray-400 dark:text-gray-500">
                            <span>Labor</span>
                            <span>Material</span>
                            <span>Other</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            {(['labor', 'material', 'other'] as const).map((key) => (
                              <CurrencyInput
                                key={`${job.id}-ctc-${key}`}
                                id={`ctc-${job.id}-${key}`}
                                name={`costToComplete.${key}`}
                                value={job.costToComplete[key]}
                                onChange={(_, value) => {
                                  if (!canInlineEdit) return;
                                  onQuickUpdate(job.id, {
                                    type: 'component',
                                    field: 'costToComplete',
                                    key,
                                    value,
                                  });
                                }}
                                disabled={!canInlineEdit || isSavingField(`${job.id}-costToComplete-${key}`)}
                                className={`${weeklyInputClass} text-xs`}
                              />
                            ))}
                          </div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <span>Total {currencyFormatter.format(totalCostToComplete)}</span>
                            {(['labor', 'material', 'other'] as const).some((key) =>
                              isSavingField(`${job.id}-costToComplete-${key}`)
                            ) && <span className="text-orange-500">Saving…</span>}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 align-top text-sm text-gray-700 dark:text-gray-200">
                  <div>
                    <div className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">Billing Position</div>
                    <div className={`text-base font-semibold ${billingInfo.isOverBilled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {billingInfo.label}: {currencyFormatter.format(Math.abs(billingInfo.difference))}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Earned {currencyFormatter.format(earnedRevenue.total)}
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 align-top text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-4">
                    <button
                      onClick={() => onOpenNotes(job)}
                      className="relative text-gray-500 dark:text-gray-400 hover:text-brand-blue dark:hover:text-white"
                      title="View/Add Notes"
                    >
                      <ChatBubbleLeftTextIcon />
                      {job.notes && job.notes.length > 0 && (
                        <span className="absolute -top-1 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                          {job.notes.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => onEdit(job)}
                      className={`${
                        isEstimatorWithRestrictedAccess
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

