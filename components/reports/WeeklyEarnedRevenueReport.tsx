import React, { useState, useEffect, useMemo } from 'react';
import { Job } from '../../types';
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
}> = ({ week, isCurrentWeek }) => {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border ${isCurrentWeek ? 'border-orange-500 shadow-lg shadow-orange-500/10' : 'border-slate-200 dark:border-slate-700'} p-4`}>
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
          <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-full font-medium">
            Current
          </span>
        )}
      </div>
      
      <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
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

  // Generate report data
  const reportData = useMemo(() => generateWeeklyReport(5), [generateWeeklyReport]);
  
  // Get current week info
  const currentWeekInfo = useMemo(() => getWeekInfo(new Date()), []);
  
  // Check if we need to create a snapshot for current week
  const hasCurrentWeekSnapshot = useMemo(() => {
    return weeklySnapshots.some(
      s => s.weekNumber === currentWeekInfo.weekNumber && s.year === currentWeekInfo.year
    );
  }, [weeklySnapshots, currentWeekInfo]);

  // Handle creating snapshot for current week
  const handleCreateSnapshot = async () => {
    setIsCreatingSnapshot(true);
    try {
      await createWeeklySnapshot(jobs);
    } catch (err) {
      console.error('Failed to create snapshot:', err);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Weekly Earned Revenue
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Track your earned revenue week over week (5-week lookback)
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {!hasCurrentWeekSnapshot && (
            <button
              onClick={handleCreateSnapshot}
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
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Save This Week
                </>
              )}
            </button>
          )}
          
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

      {/* Week Summary Cards */}
      {reportData.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {reportData.map((week, index) => (
              <div
                key={`${week.year}-${week.weekNumber}`}
                onClick={() => setSelectedWeek(index)}
                className={`cursor-pointer transition-transform hover:scale-[1.02] ${selectedWeek === index ? 'ring-2 ring-orange-500 rounded-xl' : ''}`}
              >
                <WeekSummaryCard
                  week={week}
                  isCurrentWeek={week.weekNumber === currentWeekInfo.weekNumber && week.year === currentWeekInfo.year}
                />
              </div>
            ))}
          </div>

          {/* Trend Chart (Simple Bar Visualization) */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
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

          {/* Job Breakdown Table */}
          {selectedWeekData && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
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
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
            Start tracking your weekly earned revenue by saving your first snapshot. 
            We'll track changes week over week automatically.
          </p>
          <button
            onClick={handleCreateSnapshot}
            disabled={isCreatingSnapshot}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isCreatingSnapshot ? 'Saving...' : 'Save First Snapshot'}
          </button>
        </div>
      )}
    </div>
  );
};

export default WeeklyEarnedRevenueReport;

