import React from 'react';
import { Job, JobStatus, CostBreakdown, UserRole } from '../../types';
import ProgressBar from '../ui/ProgressBar';
import { EditIcon, ChatBubbleLeftTextIcon, ClockIcon } from '../shared/icons';

interface JobCardGridProps {
  jobs: Job[];
  onEdit: (job: Job) => void;
  onOpenNotes: (job: Job) => void;
  userRole: UserRole;
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

const sumBreakdown = (breakdown: CostBreakdown): number => breakdown.labor + breakdown.material + breakdown.other;

const JobCard: React.FC<{ job: Job; onEdit: (job: Job) => void; onOpenNotes: (job: Job) => void; userRole: UserRole; }> = ({ job, onEdit, onOpenNotes, userRole }) => {
  
  const totalCost = sumBreakdown(job.costs);
  const totalOriginalBudget = sumBreakdown(job.budget);
  const totalContract = sumBreakdown(job.contract);
  const totalInvoiced = sumBreakdown(job.invoiced);
  const totalCostToComplete = sumBreakdown(job.costToComplete);

  const totalForecastedBudget = totalCost + totalCostToComplete;
  
  const originalProfit = totalContract - totalOriginalBudget;
  const originalProfitMargin = totalContract > 0 ? (originalProfit / totalContract) * 100 : 0;
  
  const forecastedProfit = totalContract - totalForecastedBudget;
  const forecastedProfitMargin = totalContract > 0 ? (forecastedProfit / totalContract) * 100 : 0;
  
  const profitVariance = forecastedProfit - originalProfit;
  const budgetVariance = totalForecastedBudget - totalOriginalBudget;
  const budgetVarianceColor = budgetVariance > 0 ? 'text-red-600 dark:text-red-500' : budgetVariance < 0 ? 'text-green-600 dark:text-green-500' : 'text-gray-800 dark:text-gray-200';


  const overallPercentComplete = totalOriginalBudget > 0 ? totalCost / totalOriginalBudget : 0;
  const totalEarnedRevenue = totalContract * overallPercentComplete;

  const billingDifference = totalInvoiced - totalEarnedRevenue;
  const billingStatus = billingDifference > 0 ? 'Over Billed' : 'Under Billed';
  const billingStatusColor = billingDifference > 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500';

  const targetVariance = typeof job.targetProfit === 'number' ? forecastedProfit - job.targetProfit : null;
  const targetMarginDisplay = job.targetMargin !== undefined ? `${job.targetMargin.toFixed(1)}%` : '—';
  const targetEndDateDisplay = job.targetEndDate ? (job.targetEndDate === 'TBD' ? 'TBD' : new Date(job.targetEndDate).toLocaleDateString()) : '—';
  const isBehindTargetSchedule = job.targetEndDate && job.targetEndDate !== 'TBD' && job.endDate !== 'TBD' && new Date(job.endDate).getTime() > new Date(job.targetEndDate).getTime();

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
          <span className={`px-2 py-1 text-xs font-semibold rounded-full self-start flex-shrink-0 ${
            job.status === JobStatus.Future ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
            job.status === JobStatus.Active ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 
            job.status === JobStatus.OnHold ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
            job.status === JobStatus.Completed ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
          }`}>
            {job.status}
          </span>
        </div>
        
        {daysOnHold !== null && (
          <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/50 border-l-4 border-yellow-400 dark:border-yellow-500 text-yellow-700 dark:text-yellow-300 text-sm font-semibold rounded-r-md">
            On Hold for {daysOnHold} day{daysOnHold !== 1 ? 's' : ''}
          </div>
        )}

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-4">{job.client}</p>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600 dark:text-gray-300">PM:</span>
            <span>{job.projectManager}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600 dark:text-gray-300">Start Date:</span>
            <span>{job.startDate === 'TBD' ? 'TBD' : new Date(job.startDate).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600 dark:text-gray-300">Contract:</span>
            <span>{currencyFormatter.format(totalContract)}</span>
          </div>
        </div>

        <div className="mt-4 text-sm bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
            <p className="font-semibold text-gray-600 dark:text-gray-300">Profitability</p>
            <div className="pl-2 space-y-1 mt-1">
                <div className="flex justify-between"><span>Original Profit:</span> <span className={`${originalProfit >= 0 ? 'text-gray-700 dark:text-gray-200' : 'text-red-700 dark:text-red-400'}`}>{currencyFormatter.format(originalProfit)} ({originalProfitMargin.toFixed(1)}%)</span></div>
                <div className="flex justify-between"><span>Forecasted Profit:</span> <span className={`font-bold ${forecastedProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{currencyFormatter.format(forecastedProfit)} ({forecastedProfitMargin.toFixed(1)}%)</span></div>
                <div className="flex justify-between font-bold border-t dark:border-gray-600 mt-1 pt-1"><span>Variance:</span> <span className={`${profitVariance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{currencyFormatter.format(profitVariance)}</span></div>
            </div>
        </div>


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


         <div className="mt-4 text-sm">
          <p className="font-semibold text-gray-600 dark:text-gray-300">Revenue & Billing (Earned / Invoiced)</p>
          <div className="pl-2 space-y-1 mt-1">
            <div className="flex justify-between font-bold">
                <span>Total:</span> <span>{currencyFormatter.format(totalEarnedRevenue)} / <span className="text-gray-400 dark:text-gray-500">{currencyFormatter.format(totalInvoiced)}</span></span>
            </div>
            {billingDifference !== 0 && (
              <div className={`flex justify-between font-bold mt-1 pt-1 text-xs ${billingStatusColor}`}>
                <span>{billingStatus}:</span>
                <span>{currencyFormatter.format(Math.abs(billingDifference))}</span>
              </div>
            )}
          </div>
        </div>

        {userRole === 'projectManager' && (
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

        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">% Complete (vs Forecast)</h4>
          <div className="space-y-2">
            <ProgressBar label="Labor" percentage={calculateProgress(job.costs.labor, job.costToComplete.labor)} />
            <ProgressBar label="Material" percentage={calculateProgress(job.costs.material, job.costToComplete.material)} />
            <ProgressBar label="Other" percentage={calculateProgress(job.costs.other, job.costToComplete.other)} />
          </div>
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3 flex items-center">
        {job.lastUpdated && (
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <ClockIcon className="w-4 h-4 mr-1" />
            <span>Updated: {new Date(job.lastUpdated).toLocaleDateString()}</span>
          </div>
        )}
        <div className="flex items-center space-x-4 ml-auto">
            <button onClick={() => onOpenNotes(job)} className="relative inline-flex items-center text-gray-500 dark:text-gray-400 hover:text-brand-blue dark:hover:text-white transition">
              <ChatBubbleLeftTextIcon />
              <span className="ml-1 text-sm">Notes</span>
              {job.notes && job.notes.length > 0 && (
                <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {job.notes.length}
                </span>
              )}
            </button>
            <button onClick={() => onEdit(job)} className="inline-flex items-center text-brand-light-blue hover:text-brand-blue dark:hover:text-blue-400 transition">
              <EditIcon />
              <span className="ml-1 text-sm">Edit</span>
            </button>
        </div>
      </div>
    </div>
  );
}

const JobCardGrid: React.FC<JobCardGridProps> = ({ jobs, onEdit, onOpenNotes, userRole }) => {
  if (jobs.length === 0) {
    return <div className="text-center py-16 text-gray-500 dark:text-gray-400">No jobs found for this category.</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} onEdit={onEdit} onOpenNotes={onOpenNotes} userRole={userRole} />
      ))}
    </div>
  );
};

export default JobCardGrid;