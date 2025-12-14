import React, { useEffect } from 'react';
import { Job, JobStatus, UserRole } from '../../../types';
import ProgressBar from '../../../components/ui/ProgressBar';
import { EditIcon, ChatBubbleLeftTextIcon, ClockIcon } from '../../../components/shared/icons';
import { sumBreakdown, calculateEarnedRevenue, calculateBillingDifference, calculateForecastedProfit, getAllScheduleWarnings } from '../lib/jobCalculations';
import { analyzeJobRisk, RiskLevel } from '../lib/smartEngines';
import { useSubscription } from '../../../hooks/useSubscription';
import { useChangeOrderCounts, COCountByJob } from '../../../hooks/useSupabaseChangeOrders';

interface JobCardGridProps {
  jobs: Job[];
  onEdit: (job: Job) => void;
  onOpenNotes: (job: Job) => void;
  onOpenHistory?: (job: Job) => void;
  onTakeSnapshot?: (job: Job) => void;
  onOpenChangeOrders?: (job: Job) => void;
  userRole: UserRole;
  activeEstimator?: string;
  companyId?: string;
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

const JobCard: React.FC<{ job: Job; onEdit: (job: Job) => void; onOpenNotes: (job: Job) => void; onOpenHistory?: (job: Job) => void; onTakeSnapshot?: (job: Job) => void; onOpenChangeOrders?: (job: Job) => void; userRole: UserRole; activeEstimator?: string; isPro: boolean; coCount?: COCountByJob; }> = ({ job, onEdit, onOpenNotes, onOpenHistory, onTakeSnapshot, onOpenChangeOrders, userRole, activeEstimator, isPro, coCount }) => {
  // Estimators can only edit Future or Draft jobs where they are the assigned estimator
  const isEstimatorWithRestrictedAccess = userRole === 'estimator' && job.status !== JobStatus.Future && job.status !== JobStatus.Draft;
  const isTM = job.jobType === 'time-material';

  const totalCost = sumBreakdown(job.costs);
  const totalOriginalBudget = sumBreakdown(job.budget);
  const totalContract = sumBreakdown(job.contract);
  const totalInvoiced = sumBreakdown(job.invoiced);
  const totalCostToComplete = sumBreakdown(job.costToComplete);

  // Use the shared calculation functions
  const earnedRevenue = calculateEarnedRevenue(job);
  const billingInfo = calculateBillingDifference(job);
  const forecastedProfit = calculateForecastedProfit(job);

  // Fixed price specific calculations
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

  const targetVariance = typeof job.targetProfit === 'number' ? forecastedProfit - job.targetProfit : null;
  const targetMarginDisplay = job.targetMargin !== undefined ? `${job.targetMargin.toFixed(1)}%` : '—';
  const targetEndDateDisplay = job.targetEndDate ? (job.targetEndDate === 'TBD' ? 'TBD' : new Date(job.targetEndDate).toLocaleDateString()) : '—';
  const isBehindTargetSchedule = job.targetEndDate && job.targetEndDate !== 'TBD' && job.endDate !== 'TBD' && new Date(job.endDate).getTime() > new Date(job.targetEndDate).getTime();

  // Smart Engine Analysis
  const riskAnalysis = analyzeJobRisk(job);
  const showUnderbillingRisk = riskAnalysis.underbillingRisk !== RiskLevel.None && riskAnalysis.underbillingRisk !== RiskLevel.Low;
  const showScheduleDrift = riskAnalysis.scheduleDriftWeeks > 2;
  const showMarginFade = riskAnalysis.isMarginFading;

  // Get all schedule warnings (mobilization + target date)
  const scheduleWarnings = getAllScheduleWarnings(job);
  const hasScheduleWarning = scheduleWarnings.length > 0;
  const hasCriticalWarning = scheduleWarnings.some(w => w.severity === 'critical');

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


  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden transform hover:scale-105 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ease-in-out flex flex-col">
      <div className="p-5 flex-grow">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-brand-blue dark:text-brand-light-blue leading-tight">{job.jobName}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">#{job.jobNo}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${job.status === JobStatus.Draft ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-dashed border-slate-400' :
              job.status === JobStatus.Future ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
                job.status === JobStatus.Active ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                  job.status === JobStatus.OnHold ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                    job.status === JobStatus.Completed ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
              {job.status}
            </span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${isTM
              ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
              : 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
              }`}>
              {isTM ? 'T&M' : 'Fixed'}
            </span>
          </div>
        </div>

        {daysOnHold !== null && (
          <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/50 border-l-4 border-yellow-400 dark:border-yellow-500 text-yellow-700 dark:text-yellow-300 text-sm font-semibold rounded-r-md">
            On Hold for {daysOnHold} day{daysOnHold !== 1 ? 's' : ''}
          </div>
        )}

        {/* Smart Engine Alerts */}
        {/* Smart Engine Alerts (Functionality Gating) */}
        {!isPro ? (
          (showUnderbillingRisk || showScheduleDrift || showMarginFade) && (
            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700/50 rounded text-center border border-dashed border-gray-300 dark:border-gray-600">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                🔒 Pro Insight Detected
              </span>
            </div>
          )
        ) : (
          <div className="flex flex-wrap gap-2 mt-2">
            {showUnderbillingRisk && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${riskAnalysis.underbillingRisk === RiskLevel.High
                ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                }`}>
                <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {riskAnalysis.underbillingRisk === RiskLevel.High ? 'High Risk' : 'Risk'}: Underbilling
              </span>
            )}
            {showScheduleDrift && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
                <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Drift: {riskAnalysis.scheduleDriftWeeks} wks
              </span>
            )}
            {showMarginFade && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300">
                <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
                Fade: -{riskAnalysis.marginFadePercent.toFixed(1)}% pts
              </span>
            )}
          </div>
        )}

        {/* Schedule Warning Banner */}
        {hasScheduleWarning && (
          <div className={`mt-2 p-2 ${hasCriticalWarning ? 'bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500' : 'bg-amber-50 dark:bg-amber-900/50 border-l-4 border-amber-500'} rounded-r-md`}>
            <div className="flex items-center gap-2">
              <span className={`text-lg ${hasCriticalWarning ? 'text-red-600' : 'text-amber-600'}`}>⚠️</span>
              <div className="flex-1">
                <p className={`text-xs font-semibold ${hasCriticalWarning ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'}`}>
                  Behind Schedule
                </p>
                <p className={`text-xs ${hasCriticalWarning ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {scheduleWarnings[0]?.message}
                  {scheduleWarnings.length > 1 && ` (+${scheduleWarnings.length - 1} more)`}
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-4">{job.client}</p>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600 dark:text-gray-300">PM:</span>
            <span>{job.projectManager}</span>
          </div>
          {job.estimator && (
            <div className="flex justify-between">
              <span className="font-semibold text-gray-600 dark:text-gray-300">Estimator:</span>
              <span>{job.estimator}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600 dark:text-gray-300">Start Date:</span>
            <span>{job.startDate === 'TBD' ? 'TBD' : new Date(job.startDate).toLocaleDateString()}</span>
          </div>
          {!isTM && (
            <div className="flex justify-between">
              <span className="font-semibold text-gray-600 dark:text-gray-300">Contract:</span>
              <span>{currencyFormatter.format(totalContract)}</span>
            </div>
          )}
        </div>

        {/* Profitability Section */}
        <div className="mt-4 text-sm bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
          <p className="font-semibold text-gray-600 dark:text-gray-300">Profitability</p>
          <div className="pl-2 space-y-1 mt-1">
            {!isTM && (
              <div className="flex justify-between"><span>Original Profit:</span> <span className={`${originalProfit >= 0 ? 'text-gray-700 dark:text-gray-200' : 'text-red-700 dark:text-red-400'}`}>{currencyFormatter.format(originalProfit)} ({originalProfitMargin.toFixed(1)}%)</span></div>
            )}
            <div className="flex justify-between">
              <span>{isTM ? 'Current Profit:' : 'Forecasted Profit:'}</span>
              <span className={`font-bold ${forecastedProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {currencyFormatter.format(forecastedProfit)} ({forecastedProfitMargin.toFixed(1)}%)
              </span>
            </div>
            {!isTM && (
              <div className="flex justify-between font-bold border-t dark:border-gray-600 mt-1 pt-1"><span>Variance:</span> <span className={`${profitVariance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{currencyFormatter.format(profitVariance)}</span></div>
            )}
          </div>
        </div>

        {/* Cost Summary (Fixed Price only) */}
        {!isTM && (
          <div className="mt-4 text-sm">
            <p className="font-semibold text-gray-600 dark:text-gray-300">Cost Summary</p>
            <div className="pl-2 space-y-1 mt-1">
              <div className="flex justify-between"><span>Cost to Date:</span> <span>{currencyFormatter.format(totalCost)}</span></div>
              <div className="flex justify-between"><span>Original Budget:</span> <span className="text-gray-500 dark:text-gray-400">{currencyFormatter.format(totalOriginalBudget)}</span></div>
              <div className={`flex justify-between font-bold border-t dark:border-gray-600 mt-1 pt-1 ${budgetVarianceColor}`}>
                <span>Forecasted Budget:</span>
                <span>{currencyFormatter.format(totalForecastedBudget)}</span>
              </div>
            </div>
          </div>
        )}

        {/* T&M Cost Summary */}
        {isTM && (
          <div className="mt-4 text-sm">
            <p className="font-semibold text-gray-600 dark:text-gray-300">Costs & Revenue</p>
            <div className="pl-2 space-y-1 mt-1">
              <div className="flex justify-between"><span>Costs to Date:</span> <span>{currencyFormatter.format(totalCost)}</span></div>
              <div className="flex justify-between"><span>Earned Revenue:</span> <span className="font-semibold text-green-600 dark:text-green-400">{currencyFormatter.format(earnedRevenue.total)}</span></div>
            </div>
          </div>
        )}

        {/* Revenue & Billing */}
        <div className="mt-4 text-sm">
          <p className="font-semibold text-gray-600 dark:text-gray-300">Billing Status</p>
          <div className="pl-2 space-y-1 mt-1">
            <div className="flex justify-between">
              <span>Earned:</span> <span>{currencyFormatter.format(earnedRevenue.total)}</span>
            </div>
            <div className="flex justify-between">
              <span>Invoiced:</span> <span className="text-gray-500 dark:text-gray-400">{currencyFormatter.format(totalInvoiced)}</span>
            </div>
            {billingInfo.difference !== 0 && (
              <div className={`flex justify-between font-bold mt-1 pt-1 border-t dark:border-gray-600 text-xs ${billingInfo.isOverBilled ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                <span>{billingInfo.label}:</span>
                <span>{currencyFormatter.format(Math.abs(billingInfo.difference))}</span>
              </div>
            )}
          </div>
        </div>

        {/* Targets (Fixed Price & PM role only) */}
        {!isTM && userRole === 'projectManager' && (
          <div className="mt-4 text-sm bg-blue-50 dark:bg-blue-900/40 p-3 rounded-md">
            <p className="font-semibold text-gray-700 dark:text-gray-200">Targets</p>
            <div className="pl-2 space-y-1 mt-1">
              <div className="flex justify-between"><span>Target Profit:</span><span>{typeof job.targetProfit === 'number' ? currencyFormatter.format(job.targetProfit) : '—'}</span></div>
              <div className="flex justify-between"><span>Target Margin:</span><span>{targetMarginDisplay}</span></div>
              <div className={`flex justify-between font-semibold ${targetVariance !== null ? (targetVariance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400') : 'text-gray-500 dark:text-gray-400'}`}>
                <span>Forecast vs Target:</span>
                <span>{targetVariance !== null ? currencyFormatter.format(targetVariance) : '—'}</span>
              </div>
              <div className="flex justify-between"><span>Target Completion:</span><span>{targetEndDateDisplay}</span></div>
              {isBehindTargetSchedule && (
                <div className="flex justify-between font-semibold text-red-600 dark:text-red-400">
                  <span>Schedule Risk:</span>
                  <span>Behind target</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress bars (Fixed Price only) */}
        {!isTM && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">% Complete (vs Forecast)</h4>
            <div className="space-y-2">
              <ProgressBar label="Labor" percentage={calculateProgress(job.costs.labor, job.costToComplete.labor)} />
              <ProgressBar label="Material" percentage={calculateProgress(job.costs.material, job.costToComplete.material)} />
              <ProgressBar label="Other" percentage={calculateProgress(job.costs.other, job.costToComplete.other)} />
            </div>
          </div>
        )}

        {/* T&M Hours info */}
        {isTM && job.tmSettings?.laborBillingType === 'fixed-rate' && job.tmSettings.laborHours && (
          <div className="mt-4 text-sm bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md">
            <div className="flex justify-between">
              <span className="font-semibold text-blue-700 dark:text-blue-300">Hours Worked:</span>
              <span className="text-blue-800 dark:text-blue-200">{job.tmSettings.laborHours} hrs @ ${job.tmSettings.laborBillRate}/hr</span>
            </div>
          </div>
        )}
      </div>
      <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3 flex items-center">
        {job.lastUpdated && (
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
            <ClockIcon className="w-4 h-4 mr-1" />
            <span>Updated: {new Date(job.lastUpdated).toLocaleDateString()}</span>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => onOpenNotes(job)} className="relative inline-flex items-center text-gray-500 dark:text-gray-400 hover:text-brand-blue dark:hover:text-white transition">
            <ChatBubbleLeftTextIcon />
            <span className="ml-1 text-sm">Notes</span>
            {job.notes && job.notes.length > 0 && (
              <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {job.notes.length}
              </span>
            )}
          </button>
          {onTakeSnapshot && (
            <button
              onClick={() => onTakeSnapshot(job)}
              className="inline-flex items-center text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition"
              title="Take a snapshot of current job financials"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
          {onOpenHistory && (
            <button onClick={() => onOpenHistory(job)} className="inline-flex items-center text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition" title="View history">
              <ClockIcon className="w-5 h-5" />
            </button>
          )}
          {onOpenChangeOrders && (
            <button onClick={() => onOpenChangeOrders(job)} className="relative inline-flex items-center text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition" title="Manage Change Orders">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="ml-1 text-sm">COs</span>
              {coCount && coCount.total > 0 && (
                <span className={`absolute -top-1 -right-2 flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-xs font-bold text-white ${coCount.pending > 0 ? 'bg-amber-500' : 'bg-green-500'
                  }`}>
                  {coCount.total}
                </span>
              )}
            </button>
          )}
          <button
            onClick={() => onEdit(job)}
            className={`inline-flex items-center transition ml-auto ${isEstimatorWithRestrictedAccess
              ? 'text-gray-400 dark:text-gray-500'
              : 'text-brand-light-blue hover:text-brand-blue dark:hover:text-blue-400'
              }`}
          >
            <EditIcon />
            <span className="ml-1 text-sm">{isEstimatorWithRestrictedAccess ? 'View' : 'Edit'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const JobCardGrid: React.FC<JobCardGridProps> = ({ jobs, onEdit, onOpenNotes, onOpenHistory, onTakeSnapshot, onOpenChangeOrders, userRole, activeEstimator, companyId }) => {
  const { isPro } = useSubscription();
  const { coCounts, loadCOCounts, getCountForJob } = useChangeOrderCounts(companyId);

  // Load CO counts on mount and when jobs change
  useEffect(() => {
    if (companyId && onOpenChangeOrders) {
      loadCOCounts();
    }
  }, [companyId, loadCOCounts, onOpenChangeOrders]);

  if (jobs.length === 0) {
    return <div className="text-center py-16 text-gray-500 dark:text-gray-400">No jobs found for this category.</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} onEdit={onEdit} onOpenNotes={onOpenNotes} onOpenHistory={onOpenHistory} onTakeSnapshot={onTakeSnapshot} onOpenChangeOrders={onOpenChangeOrders} userRole={userRole} activeEstimator={activeEstimator} isPro={isPro} coCount={getCountForJob(job.id)} />
      ))}
    </div>
  );
};

export default JobCardGrid;

