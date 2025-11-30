import React, { useState, useMemo } from 'react';
import { Job, JobStatus } from '../../types';
import { useMonthlySnapshots, MonthEndReportData, getMonthInfo } from '../../hooks/useWeeklySnapshots';

// ============================================================================
// Types
// ============================================================================

interface MonthEndReportProps {
  jobs: Job[];
  companyId: string;
  companyName?: string;
  onExportPDF?: () => void;
}

// ============================================================================
// Formatters
// ============================================================================

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

// ============================================================================
// Sub-Components
// ============================================================================

const SummaryCard: React.FC<{
  label: string;
  value: string;
  subValue?: string;
  colorClass?: string;
  icon?: React.ReactNode;
}> = ({ label, value, subValue, colorClass = 'text-slate-900 dark:text-white', icon }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      {icon}
    </div>
    <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
    {subValue && (
      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subValue}</div>
    )}
  </div>
);

const BillingStatusBadge: React.FC<{ isOverBilled: boolean; amount: number }> = ({ isOverBilled, amount }) => {
  if (amount === 0) {
    return <span className="text-slate-400">Even</span>;
  }
  
  const colorClass = isOverBilled
    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {isOverBilled ? 'Over' : 'Under'}
      <span className="font-semibold">{formatCurrency(Math.abs(amount))}</span>
    </span>
  );
};

const ProfitIndicator: React.FC<{ margin: number }> = ({ margin }) => {
  let colorClass = 'text-slate-600 dark:text-slate-400';
  let bgClass = 'bg-slate-100 dark:bg-slate-700';
  
  if (margin >= 20) {
    colorClass = 'text-emerald-700 dark:text-emerald-400';
    bgClass = 'bg-emerald-100 dark:bg-emerald-900/30';
  } else if (margin >= 10) {
    colorClass = 'text-blue-700 dark:text-blue-400';
    bgClass = 'bg-blue-100 dark:bg-blue-900/30';
  } else if (margin < 0) {
    colorClass = 'text-red-700 dark:text-red-400';
    bgClass = 'bg-red-100 dark:bg-red-900/30';
  }
  
  return (
    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${colorClass} ${bgClass}`}>
      {formatPercent(margin)}
    </span>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const MonthEndReport: React.FC<MonthEndReportProps> = ({
  jobs,
  companyId,
  companyName,
  onExportPDF,
}) => {
  const {
    monthlySnapshots,
    loading,
    createMonthlySnapshot,
    finalizeMonth,
    generateMonthEndReport,
  } = useMonthlySnapshots(companyId);
  
  const [selectedMonth, setSelectedMonth] = useState<{ month: number; year: number }>(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [activeTab, setActiveTab] = useState<'wip' | 'profitability' | 'billing'>('wip');

  // Generate report for current selection
  const reportData: MonthEndReportData = useMemo(() => {
    return generateMonthEndReport(jobs);
  }, [generateMonthEndReport, jobs]);

  // Check if we have a saved snapshot for selected month
  const savedSnapshot = useMemo(() => {
    return monthlySnapshots.find(
      s => s.month === selectedMonth.month && s.year === selectedMonth.year
    );
  }, [monthlySnapshots, selectedMonth]);

  // Handle saving snapshot
  const handleSaveSnapshot = async () => {
    setIsCreatingSnapshot(true);
    try {
      await createMonthlySnapshot(jobs, selectedMonth.month, selectedMonth.year);
    } catch (err) {
      console.error('Failed to save month-end snapshot:', err);
    } finally {
      setIsCreatingSnapshot(false);
    }
  };

  // Calculate summary metrics
  const totalJobs = reportData.jobs.length;
  const overBilledJobs = reportData.jobs.filter(j => j.isOverBilled).length;
  const underBilledJobs = reportData.jobs.filter(j => !j.isOverBilled && j.overUnderBilling !== 0).length;
  const avgProfitMargin = totalJobs > 0
    ? reportData.jobs.reduce((sum, j) => sum + j.profitMargin, 0) / totalJobs
    : 0;

  // Get current month info for display
  const monthInfo = getMonthInfo(new Date(selectedMonth.year, selectedMonth.month - 1, 1));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6" id="month-end-report">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Month-End Report
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {monthInfo.monthName} {monthInfo.year} • {companyName || 'Your Company'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Month Selector */}
          <select
            value={`${selectedMonth.year}-${selectedMonth.month}`}
            onChange={(e) => {
              const [year, month] = e.target.value.split('-').map(Number);
              setSelectedMonth({ year, month });
            }}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            {Array.from({ length: 12 }, (_, i) => {
              const date = new Date();
              date.setMonth(date.getMonth() - i);
              const month = date.getMonth() + 1;
              const year = date.getFullYear();
              const info = getMonthInfo(date);
              return (
                <option key={`${year}-${month}`} value={`${year}-${month}`}>
                  {info.monthName} {year}
                </option>
              );
            })}
          </select>
          
          <button
            onClick={handleSaveSnapshot}
            disabled={isCreatingSnapshot}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isCreatingSnapshot ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : savedSnapshot ? (
              'Update Snapshot'
            ) : (
              'Save Snapshot'
            )}
          </button>
          
          {onExportPDF && (
            <button
              onClick={onExportPDF}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export PDF
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Earned Revenue"
          value={formatCurrency(reportData.totalEarnedRevenue)}
          icon={
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <SummaryCard
          label="Total Contract Value"
          value={formatCurrency(reportData.totalContractValue)}
          subValue={`${totalJobs} active jobs`}
          icon={
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <SummaryCard
          label="Net Billing Position"
          value={formatCurrency(reportData.netBillingPosition)}
          subValue={reportData.netBillingPosition >= 0 ? 'Net Over Billed' : 'Net Under Billed'}
          colorClass={reportData.netBillingPosition >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}
          icon={
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          }
        />
        <SummaryCard
          label="Avg Profit Margin"
          value={formatPercent(avgProfitMargin)}
          subValue={avgProfitMargin >= 15 ? 'Healthy' : avgProfitMargin >= 10 ? 'Moderate' : 'Low'}
          colorClass={avgProfitMargin >= 15 ? 'text-emerald-600 dark:text-emerald-400' : avgProfitMargin >= 10 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}
          icon={
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
      </div>

      {/* Billing Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-emerald-700 dark:text-emerald-400">Over Billed</span>
            <span className="text-xs bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-300 px-2 py-1 rounded-full">
              {overBilledJobs} jobs
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-2">
            {formatCurrency(reportData.totalOverBilling)}
          </div>
        </div>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-amber-700 dark:text-amber-400">Under Billed</span>
            <span className="text-xs bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-300 px-2 py-1 rounded-full">
              {underBilledJobs} jobs
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-2">
            {formatCurrency(reportData.totalUnderBilling)}
          </div>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700 dark:text-blue-400">Total Invoiced</span>
            <span className="text-xs bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full">
              {totalJobs} jobs
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-2">
            {formatCurrency(reportData.totalInvoiced)}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-700">
          <nav className="flex">
            {[
              { id: 'wip', label: 'WIP Summary' },
              { id: 'profitability', label: 'Job Profitability' },
              { id: 'billing', label: 'Billing Status' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Job
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Client
                </th>
                {activeTab === 'wip' && (
                  <>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Contract
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Costs
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      % Complete
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Earned
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Invoiced
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Over/Under
                    </th>
                  </>
                )}
                {activeTab === 'profitability' && (
                  <>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Contract
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Costs
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Forecast Profit
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Margin
                    </th>
                  </>
                )}
                {activeTab === 'billing' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      PM
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Earned
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Invoiced
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {reportData.jobs.map(job => (
                <tr key={job.jobId} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 dark:text-white">{job.jobNo}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{job.jobName}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{job.client}</td>
                  
                  {activeTab === 'wip' && (
                    <>
                      <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">
                        {formatCurrency(job.contractValue)}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300">
                        {formatCurrency(job.costsToDate)}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300">
                        {formatPercent(job.percentComplete)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">
                        {formatCurrency(job.earnedRevenue)}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300">
                        {formatCurrency(job.invoiced)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <BillingStatusBadge isOverBilled={job.isOverBilled} amount={job.overUnderBilling} />
                      </td>
                    </>
                  )}
                  
                  {activeTab === 'profitability' && (
                    <>
                      <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">
                        {formatCurrency(job.contractValue)}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300">
                        {formatCurrency(job.costsToDate)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">
                        {formatCurrency(job.forecastedProfit)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ProfitIndicator margin={job.profitMargin} />
                      </td>
                    </>
                  )}
                  
                  {activeTab === 'billing' && (
                    <>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{job.projectManager}</td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">
                        {formatCurrency(job.earnedRevenue)}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300">
                        {formatCurrency(job.invoiced)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <BillingStatusBadge isOverBilled={job.isOverBilled} amount={job.overUnderBilling} />
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-slate-700/50 font-semibold">
              <tr>
                <td colSpan={2} className="px-6 py-4 text-slate-900 dark:text-white">Total</td>
                {activeTab === 'wip' && (
                  <>
                    <td className="px-6 py-4 text-right text-slate-900 dark:text-white">
                      {formatCurrency(reportData.totalContractValue)}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300">
                      {formatCurrency(reportData.totalCostsToDate)}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300">—</td>
                    <td className="px-6 py-4 text-right text-slate-900 dark:text-white">
                      {formatCurrency(reportData.totalEarnedRevenue)}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300">
                      {formatCurrency(reportData.totalInvoiced)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <BillingStatusBadge 
                        isOverBilled={reportData.netBillingPosition >= 0} 
                        amount={reportData.netBillingPosition} 
                      />
                    </td>
                  </>
                )}
                {activeTab === 'profitability' && (
                  <>
                    <td className="px-6 py-4 text-right text-slate-900 dark:text-white">
                      {formatCurrency(reportData.totalContractValue)}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300">
                      {formatCurrency(reportData.totalCostsToDate)}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-900 dark:text-white">
                      {formatCurrency(reportData.jobs.reduce((sum, j) => sum + j.forecastedProfit, 0))}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ProfitIndicator margin={avgProfitMargin} />
                    </td>
                  </>
                )}
                {activeTab === 'billing' && (
                  <>
                    <td className="px-6 py-4">—</td>
                    <td className="px-6 py-4 text-right text-slate-900 dark:text-white">
                      {formatCurrency(reportData.totalEarnedRevenue)}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300">
                      {formatCurrency(reportData.totalInvoiced)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <BillingStatusBadge 
                        isOverBilled={reportData.netBillingPosition >= 0} 
                        amount={reportData.netBillingPosition} 
                      />
                    </td>
                  </>
                )}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Report Footer */}
      <div className="text-center text-sm text-slate-500 dark:text-slate-400">
        <p>
          Generated {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
        {savedSnapshot?.finalizedAt && (
          <p className="text-emerald-600 dark:text-emerald-400 mt-1">
            ✓ Month finalized on {new Date(savedSnapshot.finalizedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default MonthEndReport;

