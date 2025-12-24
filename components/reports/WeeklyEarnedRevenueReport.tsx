import React, { useState, useEffect, useMemo } from 'react';
import { Job, JobStatus } from '../../types';
import { useWeeklySnapshots, WeeklyReportData, getWeekInfo } from '../../hooks/useWeeklySnapshots';

// ============================================================================
// Types
// ============================================================================

interface WeeklyEarnedRevenueReportProps {
  jobs: Job[];
  companyId: string;
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

const formatPercent = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};

const formatChange = (value: number): string => {
  const prefix = value >= 0 ? '+' : '';
  return prefix + formatCurrency(value);
};

const formatWeekRange = (start: string, end: string): string => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
};

// ============================================================================
// Sub-Components
// ============================================================================

const ChangeIndicator: React.FC<{ value: number; showPercent?: boolean }> = ({ value, showPercent }) => {
  if (value === 0) {
    return <span className="text-slate-400">—</span>;
  }
  
  const isPositive = value > 0;
  const colorClass = isPositive 
    ? 'text-emerald-600 dark:text-emerald-400' 
    : 'text-red-600 dark:text-red-400';
  const bgClass = isPositive
    ? 'bg-emerald-100 dark:bg-emerald-900/30'
    : 'bg-red-100 dark:bg-red-900/30';
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium ${colorClass} ${bgClass}`}>
      {isPositive ? (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
        </svg>
      )}
      {showPercent ? formatPercent(value) : formatChange(value)}
    </span>
  );
};

const WeekSummaryCard: React.FC<{
  week: WeeklyReportData;
  isCurrentWeek: boolean;
  isSelected: boolean;
}> = ({ week, isCurrentWeek, isSelected }) => {
  return (
    <div 
      className={`
        bg-white dark:bg-slate-800 rounded-xl border p-4 transition-all duration-200
        ${isCurrentWeek 
          ? 'border-orange-500 shadow-lg shadow-orange-500/20 ring-1 ring-orange-500/50' 
          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
        }
        ${isSelected && !isCurrentWeek ? 'ring-2 ring-orange-500 bg-orange-50/50 dark:bg-orange-900/10' : ''}
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Week {week.weekNumber}, {week.year}
          </p>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {formatWeekRange(week.weekStart, week.weekEnd)}
          </p>
        </div>
        {isCurrentWeek && (
          <span className="text-xs bg-orange-500 text-white px-2.5 py-1 rounded-full font-medium shadow-sm">
            Current
          </span>
        )}
      </div>
      
      <div className={`text-2xl font-bold mb-2 ${isCurrentWeek ? 'text-orange-600 dark:text-orange-400' : 'text-slate-900 dark:text-white'}`}>
        {formatCurrency(week.totalEarnedRevenue)}
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500 dark:text-slate-400">vs prior:</span>
        <ChangeIndicator value={week.earnedRevenueChange} />
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const WeeklyEarnedRevenueReport: React.FC<WeeklyEarnedRevenueReportProps> = ({
  jobs,
  companyId,
  onExportPDF,
}) => {
  const {
    weeklySnapshots,
    loading,
    error,
    createWeeklySnapshot,
    generateWeeklyReport,
    loadWeeklySnapshots,
  } = useWeeklySnapshots(companyId);
  
  const [selectedWeek, setSelectedWeek] = useState<number>(0);
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Generate report data
  const reportData = useMemo(() => generateWeeklyReport(5), [generateWeeklyReport]);
  
  // Get the week info based on jobs' asOfDate (not today's date)
  // This ensures the snapshot button reflects the week the data represents
  const dataWeekInfo = useMemo(() => {
    const asOfDates = jobs
      .filter(j => j.status === JobStatus.Active)
      .map(j => j.asOfDate)
      .filter((d): d is string => !!d && d.trim() !== '');
    
    const snapshotDate = asOfDates.length > 0
      ? new Date(asOfDates.sort().reverse()[0])  // Most recent asOfDate
      : new Date();
    
    return getWeekInfo(snapshotDate);
  }, [jobs]);
  
  // Check if we already have a snapshot for the week the data represents
  const hasDataWeekSnapshot = useMemo(() => {
    return weeklySnapshots.some(
      s => s.weekNumber === dataWeekInfo.weekNumber && s.year === dataWeekInfo.year
    );
  }, [weeklySnapshots, dataWeekInfo]);

  // Handle creating snapshot for current week
  const handleCreateSnapshot = async () => {
    setIsCreatingSnapshot(true);
    try {
      await createWeeklySnapshot(jobs);
      setToast({ 
        message: `Snapshot saved for Week ${dataWeekInfo.weekNumber} (${formatWeekRange(dataWeekInfo.weekStart, dataWeekInfo.weekEnd)})`, 
        type: 'success' 
      });
    } catch (err) {
      console.error('Failed to create snapshot:', err);
      setToast({ 
        message: 'Failed to save snapshot. Please try again.', 
        type: 'error' 
      });
    } finally {
      setIsCreatingSnapshot(false);
    }
  };

  // Selected week's job breakdown
  const selectedWeekData = reportData[selectedWeek];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6" id="weekly-earned-revenue-report">
      {/* Header - Clean title with demoted secondary action */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Weekly Earned Revenue
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Track your earned revenue week over week (5-week lookback)
          </p>
        </div>
        
        {/* Secondary action - demoted to icon-only */}
        {onExportPDF && (
          <button
            onClick={onExportPDF}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Export PDF"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        )}
      </div>

      {/* Primary Action Banner - Contextual CTA when snapshot needed */}
      {!hasDataWeekSnapshot && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-200">
                Ready to save Week {dataWeekInfo.weekNumber}
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                {formatWeekRange(dataWeekInfo.weekStart, dataWeekInfo.weekEnd)} • Based on your jobs' "As Of Date"
              </p>
            </div>
          </div>
          <button
            onClick={handleCreateSnapshot}
            disabled={isCreatingSnapshot}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            title={`Save snapshot for Week ${dataWeekInfo.weekNumber}`}
          >
            {isCreatingSnapshot ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Snapshot
              </>
            )}
          </button>
        </div>
      )}

      {/* Week Summary Cards */}
      {reportData.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {reportData.map((week, index) => (
              <div
                key={`${week.year}-${week.weekNumber}`}
                onClick={() => setSelectedWeek(index)}
                className="cursor-pointer"
              >
                <WeekSummaryCard
                  week={week}
                  isCurrentWeek={week.weekNumber === dataWeekInfo.weekNumber && week.year === dataWeekInfo.year}
                  isSelected={selectedWeek === index}
                />
              </div>
            ))}
          </div>

          {/* Trend Chart (Simple Bar Visualization) - Increased top margin for semantic separation */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mt-2">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              5-Week Trend
            </h3>
            <div className="flex items-end justify-between gap-2 h-40">
              {[...reportData].reverse().map((week, index) => {
                const maxRevenue = Math.max(...reportData.map(w => w.totalEarnedRevenue));
                const heightPercent = maxRevenue > 0 ? (week.totalEarnedRevenue / maxRevenue) * 100 : 0;
                const isSelected = reportData.length - 1 - index === selectedWeek;
                
                return (
                  <div
                    key={`${week.year}-${week.weekNumber}`}
                    className="flex-1 flex flex-col items-center gap-2"
                  >
                    <div className="w-full flex flex-col items-center">
                      <span className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                        {formatCurrency(week.totalEarnedRevenue)}
                      </span>
                      <div
                        className={`w-full rounded-t-lg transition-all ${
                          isSelected
                            ? 'bg-orange-500'
                            : 'bg-slate-200 dark:bg-slate-600'
                        }`}
                        style={{ height: `${Math.max(heightPercent, 5)}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      W{week.weekNumber}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Job Breakdown Table - Increased top margin for semantic separation */}
          {selectedWeekData && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden mt-2">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Job Breakdown - Week {selectedWeekData.weekNumber}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {formatWeekRange(selectedWeekData.weekStart, selectedWeekData.weekEnd)}
                </p>
              </div>
              
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
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        PM
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Earned Revenue
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Week Change
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {selectedWeekData.jobBreakdown.map(job => (
                      <tr key={job.jobId} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900 dark:text-white">
                            {job.jobNo}
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            {job.jobName}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {job.client}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {job.projectManager}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">
                          {formatCurrency(job.earnedRevenue)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <ChangeIndicator value={job.change} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 dark:bg-slate-700/50">
                    <tr>
                      <td colSpan={3} className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                        Total
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(selectedWeekData.totalEarnedRevenue)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ChangeIndicator value={selectedWeekData.earnedRevenueChange} />
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            No Weekly Data Yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4 max-w-md mx-auto">
            Start tracking your weekly earned revenue by saving your first snapshot. 
            We'll track changes week over week automatically.
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-6">
            Based on your jobs' "As Of Date": <span className="font-medium text-slate-600 dark:text-slate-300">Week {dataWeekInfo.weekNumber} ({formatWeekRange(dataWeekInfo.weekStart, dataWeekInfo.weekEnd)})</span>
          </p>
          <button
            onClick={handleCreateSnapshot}
            disabled={isCreatingSnapshot}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            title={`Save snapshot for Week ${dataWeekInfo.weekNumber}`}
          >
            {isCreatingSnapshot ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              'Save First Snapshot'
            )}
          </button>
        </div>
      )}

      {/* Toast Notification - Feedback Loop */}
      {toast && (
        <div
          className={`
            fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-lg text-sm font-medium
            flex items-center gap-3 animate-in slide-in-from-bottom-4 fade-in duration-300
            ${toast.type === 'success' 
              ? 'bg-emerald-600 text-white' 
              : 'bg-red-600 text-white'
            }
          `}
        >
          {toast.type === 'success' ? (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {toast.message}
          <button 
            onClick={() => setToast(null)}
            className="ml-2 hover:opacity-80 transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default WeeklyEarnedRevenueReport;

