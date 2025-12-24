import React, { useState, useCallback } from 'react';
import { Job, JobStatus, UserRole, CostBreakdown } from '../../../types';
import ProgressBar from '../../../components/ui/ProgressBar';
import { EditIcon, ChatBubbleLeftTextIcon, ClockIcon } from '../../../components/shared/icons';
import { sumBreakdown, calculateEarnedRevenue, calculateBillingDifference, calculateForecastedProfit, getAllScheduleWarnings } from '../lib/jobCalculations';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import InfoTooltip from '../../../components/help/InfoTooltip';

interface JobTableProps {
  jobs: Job[];
  onEdit: (job: Job) => void;
  onSave: (job: Job) => Promise<void>;
  onOpenNotes: (job: Job) => void;
  userRole: UserRole;
  focusMode: 'default' | 'pm-at-risk' | 'pm-late';
  activeEstimator?: string;
  defaultAsOfDate?: string;
  weeklyUpdateMode?: boolean;
  weeklyAsOfDate?: string;
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

const scaleBreakdownToTotal = (breakdown: CostBreakdown, total: number): CostBreakdown => {
  const currentTotal = sumBreakdown(breakdown);
  const nextTotal = Math.max(0, total || 0);

  if (currentTotal <= 0) {
    return { labor: nextTotal, material: 0, other: 0 };
  }

  // Scale proportionally, but ensure rounding doesn't change the total.
  // We do this in cents using a "largest remainder" allocation so that:
  // sum(components) === nextTotal (to the cent).
  const factor = nextTotal / currentTotal;
  const nextTotalCents = Math.round(nextTotal * 100);

  const raw = {
    labor: breakdown.labor * factor,
    material: breakdown.material * factor,
    other: breakdown.other * factor,
  };

  const floorCents = {
    labor: Math.floor(raw.labor * 100),
    material: Math.floor(raw.material * 100),
    other: Math.floor(raw.other * 100),
  };

  let remaining = nextTotalCents - (floorCents.labor + floorCents.material + floorCents.other);

  // Guard: if we somehow overshot (shouldn't with floor), fall back to rounding and force-close the diff.
  if (remaining < 0) {
    const rounded = {
      labor: Math.round(raw.labor * 100),
      material: Math.round(raw.material * 100),
      other: Math.round(raw.other * 100),
    };
    const roundedSum = rounded.labor + rounded.material + rounded.other;
    const diff = nextTotalCents - roundedSum;
    rounded.labor += diff;

    return {
      labor: rounded.labor / 100,
      material: rounded.material / 100,
      other: rounded.other / 100,
    };
  }

  const remainders = [
    { key: 'labor' as const, remainder: raw.labor * 100 - floorCents.labor },
    { key: 'material' as const, remainder: raw.material * 100 - floorCents.material },
    { key: 'other' as const, remainder: raw.other * 100 - floorCents.other },
  ].sort((a, b) => b.remainder - a.remainder);

  const allocated = { ...floorCents };
  let i = 0;
  while (remaining > 0) {
    const k = remainders[i % remainders.length].key;
    allocated[k] += 1;
    remaining -= 1;
    i += 1;
  }

  return {
    labor: allocated.labor / 100,
    material: allocated.material / 100,
    other: allocated.other / 100,
  };
};

// Inline number input component
const InlineInput: React.FC<{
  value: number;
  onChange: (value: number) => void;
  label?: string;
  compact?: boolean;
  inputClassName?: string;
}> = ({ value, onChange, label, compact = false, inputClassName }) => (
  <div className={compact ? '' : 'mb-1'}>
    {label && <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">{label}</span>}
    <input
      type="number"
      value={value || 0}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className={inputClassName || "w-20 px-1.5 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-blue focus:border-brand-blue"}
    />
  </div>
);

// Editable row component for inline editing
interface EditableRowData {
  costs: CostBreakdown;
  costToComplete: CostBreakdown;
  invoiced: CostBreakdown;
  asOfDate: string;
}

const JobTable: React.FC<JobTableProps> = ({ jobs, onEdit, onSave, onOpenNotes, userRole, focusMode, activeEstimator, defaultAsOfDate, weeklyUpdateMode = false, weeklyAsOfDate }) => {
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [editData, setEditData] = useState<EditableRowData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [simpleInputs, setSimpleInputs] = useLocalStorage<boolean>('wip-table-simple-inputs', true);
  const [showBreakdown, setShowBreakdown] = useState<{ costs: boolean; ctc: boolean; invoiced: boolean }>({
    costs: false,
    ctc: false,
    invoiced: false,
  });

  // Start editing a job row
  const handleStartEdit = useCallback((job: Job) => {
    setEditingJobId(job.id);
    setShowBreakdown({ costs: false, ctc: false, invoiced: false });
    setEditData({
      costs: { ...job.costs },
      costToComplete: { ...job.costToComplete },
      invoiced: { ...job.invoiced },
      asOfDate: defaultAsOfDate || job.asOfDate || new Date().toISOString().split('T')[0],
    });
  }, [defaultAsOfDate, setShowBreakdown]);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setEditingJobId(null);
    setEditData(null);
  }, []);

  // Save changes
  const handleSaveEdit = useCallback(async (job: Job) => {
    if (!editData) return;

    setIsSaving(true);
    try {
      const updatedJob: Job = {
        ...job,
        costs: editData.costs,
        costToComplete: editData.costToComplete,
        invoiced: editData.invoiced,
        asOfDate: editData.asOfDate,
        lastUpdated: new Date().toISOString(),
      };
      await onSave(updatedJob);
      setEditingJobId(null);
      setEditData(null);
    } catch (error) {
      console.error('Error saving job:', error);
    } finally {
      setIsSaving(false);
    }
  }, [editData, onSave]);

  // Update cost field
  const updateCost = useCallback((field: keyof CostBreakdown, value: number) => {
    setEditData(prev => prev ? {
      ...prev,
      costs: { ...prev.costs, [field]: value }
    } : null);
  }, []);

  const updateCostsTotal = useCallback((total: number) => {
    setEditData(prev => prev ? {
      ...prev,
      costs: scaleBreakdownToTotal(prev.costs, total),
    } : null);
  }, []);

  // Update cost to complete field
  const updateCostToComplete = useCallback((field: keyof CostBreakdown, value: number) => {
    setEditData(prev => prev ? {
      ...prev,
      costToComplete: { ...prev.costToComplete, [field]: value }
    } : null);
  }, []);

  const updateCostToCompleteTotal = useCallback((total: number) => {
    setEditData(prev => prev ? {
      ...prev,
      costToComplete: scaleBreakdownToTotal(prev.costToComplete, total),
    } : null);
  }, []);

  // Update invoiced field
  const updateInvoiced = useCallback((field: keyof CostBreakdown, value: number) => {
    setEditData(prev => prev ? {
      ...prev,
      invoiced: { ...prev.invoiced, [field]: value }
    } : null);
  }, []);

  const updateInvoicedTotal = useCallback((total: number) => {
    setEditData(prev => prev ? {
      ...prev,
      invoiced: scaleBreakdownToTotal(prev.invoiced, total),
    } : null);
  }, []);

  if (jobs.length === 0) {
    return <div className="text-center py-16 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg shadow-sm">No jobs found for this category.</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
        <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300 select-none">
          <input
            type="checkbox"
            checked={simpleInputs}
            onChange={(e) => setSimpleInputs(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600 text-wip-gold-dark focus:ring-wip-gold"
          />
          Simple inputs
        </label>
        <InfoTooltip
          title="Simple Inputs Mode"
          shortText="Controls how you enter costs when editing a job row."
          detailedText="ON (checked): Enter a single total for Costs, Cost-to-Complete, and Invoiced. The system automatically distributes the value across Labor, Material, and Other proportionally based on existing ratios. Click 'Show breakdown' if you need to adjust individual categories.

OFF (unchecked): Always shows Labor, Material, and Other fields separately for precise entry of each cost category."
          example="If your current costs are $6,000 Labor / $3,000 Material / $1,000 Other and you change the total to $20,000, Simple mode will scale to $12,000 / $6,000 / $2,000 (same 60/30/10 ratio)."
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[160px]">Job Name / No.</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px]">Client / PM</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[110px]">Costs to Date</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[110px]">Cost to Complete</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[130px]">Invoiced / As Of</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px]">Summary</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[80px]">% Complete</th>
            <th scope="col" className="relative px-4 py-3 min-w-[100px]">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {jobs.map((job) => {
            const isEditing = editingJobId === job.id;
            const isTM = job.jobType === 'time-material';
            const totalOriginalBudget = sumBreakdown(job.budget);
            const totalCost = sumBreakdown(isEditing && editData ? editData.costs : job.costs);
            const totalContract = sumBreakdown(job.contract);
            const totalInvoiced = sumBreakdown(isEditing && editData ? editData.invoiced : job.invoiced);
            const totalCostToComplete = sumBreakdown(isEditing && editData ? editData.costToComplete : job.costToComplete);

            // Use the editing values if currently editing
            const displayCosts = isEditing && editData ? editData.costs : job.costs;
            const displayCostToComplete = isEditing && editData ? editData.costToComplete : job.costToComplete;
            const displayInvoiced = isEditing && editData ? editData.invoiced : job.invoiced;

            // Use shared calculation functions
            const earnedRevenue = calculateEarnedRevenue(job);
            const billingInfo = calculateBillingDifference(job);
            const forecastedProfit = calculateForecastedProfit(job);

            const totalForecastedBudget = totalCost + totalCostToComplete;

            const originalProfit = totalContract - totalOriginalBudget;
            const forecastedProfitMargin = isTM
              ? (earnedRevenue.total > 0 ? (forecastedProfit / earnedRevenue.total) * 100 : 0)
              : (totalContract > 0 ? (forecastedProfit / totalContract) * 100 : 0);

            const profitVariance = isTM ? forecastedProfit : (forecastedProfit - originalProfit);

            // Get all schedule warnings (mobilization + target date)
            const scheduleWarnings = getAllScheduleWarnings(job);
            const hasScheduleWarning = scheduleWarnings.length > 0;
            const hasCriticalWarning = scheduleWarnings.some(w => w.severity === 'critical');

            // Estimators can only edit Future or Draft jobs
            const isEstimatorWithRestrictedAccess = userRole === 'estimator' && job.status !== JobStatus.Future && job.status !== JobStatus.Draft;
            const canInlineEdit = !isEstimatorWithRestrictedAccess && (job.status === JobStatus.Active || job.status === JobStatus.OnHold);

            const targetVariance = typeof job.targetProfit === 'number' ? forecastedProfit - job.targetProfit : null;
            const isMarginRisk = targetVariance !== null && targetVariance < 0;

            const displayAsOfDate = isEditing && editData ? editData.asOfDate : (job.asOfDate || '');
            const isMissingWeeklyAsOf = weeklyUpdateMode && !displayAsOfDate;
            const isAsOfMismatch = weeklyUpdateMode && !!displayAsOfDate && !!weeklyAsOfDate && displayAsOfDate !== weeklyAsOfDate;
            const isStaleSinceWeeklyDate =
              weeklyUpdateMode &&
              !!weeklyAsOfDate &&
              !!job.lastUpdated &&
              new Date(job.lastUpdated).getTime() < new Date(`${weeklyAsOfDate}T00:00:00`).getTime();

            const rowHighlightClass =
              isEditing
                ? 'ring-2 ring-brand-blue bg-blue-50 dark:bg-blue-900/20'
                : focusMode === 'pm-at-risk' && isMarginRisk
                  ? 'ring-1 ring-red-400 dark:ring-red-500'
                  : focusMode === 'pm-late' && hasScheduleWarning
                    ? hasCriticalWarning
                      ? 'ring-1 ring-red-400 dark:ring-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'ring-1 ring-yellow-400 dark:ring-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                    : '';

            return (
              <tr key={job.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${rowHighlightClass}`}>
                {/* Job Name / No. */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{job.jobName}</span>
                    {hasScheduleWarning && (
                      <span
                        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${hasCriticalWarning
                          ? 'bg-red-500 text-white'
                          : 'bg-wip-gold text-wip-heading'
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
                      : 'bg-wip-card text-wip-gold-dark dark:bg-wip-gold/30 dark:text-wip-gold'
                      }`}>
                      {isTM ? 'T&M' : 'Fixed'}
                    </span>
                  </div>
                </td>

                {/* Client / PM */}
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <div>{job.client}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">PM: {job.projectManager}</div>
                </td>

                {/* Costs to Date - Editable */}
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  {isEditing && editData ? (
                    <div className="space-y-1">
                      {simpleInputs && !showBreakdown.costs ? (
                        <div className="space-y-1">
                          <InlineInput
                            label="Total"
                            value={sumBreakdown(editData.costs)}
                            onChange={updateCostsTotal}
                            compact
                            inputClassName="w-28 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-blue focus:border-brand-blue"
                          />
                          <button
                            type="button"
                            onClick={() => setShowBreakdown(prev => ({ ...prev, costs: true }))}
                            className="text-[10px] font-semibold text-brand-blue dark:text-brand-light-blue hover:underline"
                          >
                            Show breakdown
                          </button>
                        </div>
                      ) : (
                        <>
                          {simpleInputs && (
                            <button
                              type="button"
                              onClick={() => setShowBreakdown(prev => ({ ...prev, costs: false }))}
                              className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 hover:underline"
                            >
                              Hide breakdown
                            </button>
                          )}
                          <InlineInput label="Labor" value={editData.costs.labor} onChange={(v) => updateCost('labor', v)} compact />
                          <InlineInput label="Material" value={editData.costs.material} onChange={(v) => updateCost('material', v)} compact />
                          <InlineInput label="Other" value={editData.costs.other} onChange={(v) => updateCost('other', v)} compact />
                          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 pt-1 border-t dark:border-gray-600">
                            Total: {currencyFormatter.format(sumBreakdown(editData.costs))}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <div className="text-xs"><span className="text-gray-400">L:</span> {currencyFormatter.format(displayCosts.labor)}</div>
                      <div className="text-xs"><span className="text-gray-400">M:</span> {currencyFormatter.format(displayCosts.material)}</div>
                      <div className="text-xs"><span className="text-gray-400">O:</span> {currencyFormatter.format(displayCosts.other)}</div>
                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">{currencyFormatter.format(totalCost)}</div>
                    </div>
                  )}
                </td>

                {/* Cost to Complete - Editable */}
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  {isEditing && editData ? (
                    <div className="space-y-1">
                      {simpleInputs && !showBreakdown.ctc ? (
                        <div className="space-y-1">
                          <InlineInput
                            label="Total"
                            value={sumBreakdown(editData.costToComplete)}
                            onChange={updateCostToCompleteTotal}
                            compact
                            inputClassName="w-28 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-blue focus:border-brand-blue"
                          />
                          <button
                            type="button"
                            onClick={() => setShowBreakdown(prev => ({ ...prev, ctc: true }))}
                            className="text-[10px] font-semibold text-brand-blue dark:text-brand-light-blue hover:underline"
                          >
                            Show breakdown
                          </button>
                        </div>
                      ) : (
                        <>
                          {simpleInputs && (
                            <button
                              type="button"
                              onClick={() => setShowBreakdown(prev => ({ ...prev, ctc: false }))}
                              className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 hover:underline"
                            >
                              Hide breakdown
                            </button>
                          )}
                          <InlineInput label="Labor" value={editData.costToComplete.labor} onChange={(v) => updateCostToComplete('labor', v)} compact />
                          <InlineInput label="Material" value={editData.costToComplete.material} onChange={(v) => updateCostToComplete('material', v)} compact />
                          <InlineInput label="Other" value={editData.costToComplete.other} onChange={(v) => updateCostToComplete('other', v)} compact />
                          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 pt-1 border-t dark:border-gray-600">
                            Total: {currencyFormatter.format(sumBreakdown(editData.costToComplete))}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <div className="text-xs"><span className="text-gray-400">L:</span> {currencyFormatter.format(displayCostToComplete.labor)}</div>
                      <div className="text-xs"><span className="text-gray-400">M:</span> {currencyFormatter.format(displayCostToComplete.material)}</div>
                      <div className="text-xs"><span className="text-gray-400">O:</span> {currencyFormatter.format(displayCostToComplete.other)}</div>
                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">{currencyFormatter.format(totalCostToComplete)}</div>
                    </div>
                  )}
                </td>

                {/* Invoiced - Editable */}
                <td className={`px-4 py-3 text-sm ${isEditing ? '' : 'whitespace-nowrap'}`}>
                  {isEditing && editData ? (
                    <div className="space-y-1">
                      {simpleInputs && !showBreakdown.invoiced ? (
                        <div className="space-y-1">
                          <InlineInput
                            label="Invoiced (Total)"
                            value={sumBreakdown(editData.invoiced)}
                            onChange={updateInvoicedTotal}
                            compact
                            inputClassName="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-blue focus:border-brand-blue"
                          />
                          <button
                            type="button"
                            onClick={() => setShowBreakdown(prev => ({ ...prev, invoiced: true }))}
                            className="text-[10px] font-semibold text-brand-blue dark:text-brand-light-blue hover:underline"
                          >
                            Show breakdown
                          </button>
                        </div>
                      ) : (
                        <>
                          {simpleInputs && (
                            <button
                              type="button"
                              onClick={() => setShowBreakdown(prev => ({ ...prev, invoiced: false }))}
                              className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 hover:underline"
                            >
                              Hide breakdown
                            </button>
                          )}
                          <div className="grid grid-cols-3 gap-2">
                            <InlineInput label="Labor" value={editData.invoiced.labor} onChange={(v) => updateInvoiced('labor', v)} compact inputClassName="w-full px-1.5 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-blue focus:border-brand-blue" />
                            <InlineInput label="Mat." value={editData.invoiced.material} onChange={(v) => updateInvoiced('material', v)} compact inputClassName="w-full px-1.5 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-blue focus:border-brand-blue" />
                            <InlineInput label="Other" value={editData.invoiced.other} onChange={(v) => updateInvoiced('other', v)} compact inputClassName="w-full px-1.5 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-blue focus:border-brand-blue" />
                          </div>
                          <div className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">
                            Total: {currencyFormatter.format(sumBreakdown(editData.invoiced))}
                          </div>
                        </>
                      )}
                      {/* As of Date */}
                      <div className="pt-2 border-t dark:border-gray-600">
                        <label className="text-[10px] text-wip-gold-dark dark:text-wip-gold uppercase font-semibold">As of Date</label>
                        <input
                          type="date"
                          value={editData.asOfDate}
                          onChange={(e) => setEditData(prev => prev ? { ...prev, asOfDate: e.target.value } : null)}
                          className="w-full px-1.5 py-0.5 text-xs border border-wip-border dark:border-wip-gold/50 rounded bg-wip-card dark:bg-wip-gold/30 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-wip-gold"
                        />
                        {weeklyUpdateMode && isMissingWeeklyAsOf && (
                          <div className="text-[10px] text-red-600 dark:text-red-400 mt-1 font-semibold">
                            Missing weekly As-Of date
                          </div>
                        )}
                        {weeklyUpdateMode && isAsOfMismatch && (
                          <div className="text-[10px] text-wip-gold-dark dark:text-wip-gold mt-1 font-semibold">
                            Not aligned to weekly date
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold">{currencyFormatter.format(totalInvoiced)}</div>
                      {billingInfo.difference !== 0 && (
                        <div className={`text-xs font-semibold ${billingInfo.isOverBilled ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                          {billingInfo.label}: {currencyFormatter.format(Math.abs(billingInfo.difference))}
                        </div>
                      )}
                      {weeklyUpdateMode && isMissingWeeklyAsOf && (
                        <div className="text-[10px] text-red-600 dark:text-red-400 mt-1 font-semibold">
                          Missing weekly As-Of date
                        </div>
                      )}
                      {weeklyUpdateMode && isAsOfMismatch && (
                        <div className="text-[10px] text-amber-700 dark:text-amber-300 mt-1 font-semibold">
                          As-Of not aligned to weekly date
                        </div>
                      )}
                      {weeklyUpdateMode && isStaleSinceWeeklyDate && (
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                          Not updated since weekly date
                        </div>
                      )}
                      {!!displayAsOfDate && (
                        <div className="text-[10px] text-wip-gold-dark dark:text-wip-gold mt-1">
                          As of: {new Date(displayAsOfDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}
                </td>

                {/* Summary */}
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <div className="space-y-0.5">
                    {!isTM && <div className="text-xs"><span className="text-gray-400">Contract:</span> {currencyFormatter.format(totalContract)}</div>}
                    <div className="text-xs"><span className="text-gray-400">Earned:</span> <span className="text-green-600 dark:text-green-400">{currencyFormatter.format(earnedRevenue.total)}</span></div>
                    <div className="text-xs"><span className="text-gray-400">Fcst Budget:</span> {currencyFormatter.format(totalForecastedBudget)}</div>
                    <div className={`text-xs font-semibold ${forecastedProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      Profit: {currencyFormatter.format(forecastedProfit)} ({forecastedProfitMargin.toFixed(1)}%)
                    </div>
                    {!isTM && (
                      <div className={`text-xs font-semibold ${profitVariance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        Var: {currencyFormatter.format(profitVariance)}
                      </div>
                    )}
                  </div>
                </td>

                {/* % Complete */}
                <td className="px-4 py-3 whitespace-nowrap">
                  {isTM ? (
                    <div className="text-xs text-gray-400 dark:text-gray-500 italic">N/A for T&M</div>
                  ) : (
                    <div className="w-24 space-y-1">
                      <ProgressBar label="L" percentage={calculateProgress(displayCosts.labor, displayCostToComplete.labor)} />
                      <ProgressBar label="M" percentage={calculateProgress(displayCosts.material, displayCostToComplete.material)} />
                      <ProgressBar label="O" percentage={calculateProgress(displayCosts.other, displayCostToComplete.other)} />
                    </div>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(job)}
                          disabled={isSaving}
                          className="px-2 py-1 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded disabled:opacity-50"
                        >
                          {isSaving ? '...' : 'Save'}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          className="px-2 py-1 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => onOpenNotes(job)} className="relative text-gray-500 dark:text-gray-400 hover:text-brand-blue dark:hover:text-white" title="View/Add Notes">
                          <ChatBubbleLeftTextIcon />
                          {job.notes && job.notes.length > 0 && (
                            <span className="absolute -top-1 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                              {job.notes.length}
                            </span>
                          )}
                        </button>
                        {canInlineEdit ? (
                          <button
                            onClick={() => handleStartEdit(job)}
                            className="px-2 py-1 text-xs font-semibold text-white bg-brand-blue hover:bg-brand-blue/90 rounded"
                            title="Edit Financials"
                          >
                            Edit
                          </button>
                        ) : (
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
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default JobTable;
