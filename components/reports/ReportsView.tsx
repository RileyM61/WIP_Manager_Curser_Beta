import React, { useState } from 'react';
import { Job, WeekDay } from '../../types';
import WeeklyEarnedRevenueReport from './WeeklyEarnedRevenueReport';
import MonthEndReport from './MonthEndReport';
import { exportWeeklyReportToPDF, exportMonthEndReportToPDF } from '../../lib/reportPdf';
import { getMonthInfo } from '../../hooks/useWeeklySnapshots';

// ============================================================================
// Types
// ============================================================================

interface ReportsViewProps {
  jobs: Job[];
  companyId: string;
  companyName?: string;
  weekEndDay?: WeekDay;
}

type ReportTab = 'weekly' | 'monthend';

// ============================================================================
// Main Component
// ============================================================================

const ReportsView: React.FC<ReportsViewProps> = ({
  jobs,
  companyId,
  companyName,
  weekEndDay = 'Friday',
}) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('weekly');
  const [isExporting, setIsExporting] = useState(false);

  const handleExportWeeklyPDF = async () => {
    setIsExporting(true);
    try {
      await exportWeeklyReportToPDF(companyName);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportMonthEndPDF = async () => {
    setIsExporting(true);
    try {
      const monthInfo = getMonthInfo(new Date());
      await exportMonthEndReportToPDF(monthInfo.monthName, monthInfo.year, companyName);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Type Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'weekly'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Weekly Revenue
            </span>
          </button>
          <button
            onClick={() => setActiveTab('monthend')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'monthend'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Month-End
            </span>
          </button>
        </div>

        {/* Info Badge */}
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {activeTab === 'weekly' 
            ? 'Track earned revenue trends week over week'
            : 'Comprehensive WIP summary for accounting'
          }
        </div>
      </div>

      {/* Report Content */}
      {activeTab === 'weekly' ? (
        <WeeklyEarnedRevenueReport
          jobs={jobs}
          companyId={companyId}
          weekEndDay={weekEndDay}
          onExportPDF={handleExportWeeklyPDF}
        />
      ) : (
        <MonthEndReport
          jobs={jobs}
          companyId={companyId}
          companyName={companyName}
          onExportPDF={handleExportMonthEndPDF}
        />
      )}

      {/* Export Loading Overlay */}
      {isExporting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 flex items-center gap-4 shadow-xl">
            <svg className="animate-spin h-6 w-6 text-orange-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              Generating PDF...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsView;

