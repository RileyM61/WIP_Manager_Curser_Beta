import React, { useState, useRef, useEffect, useMemo } from 'react';
import { JobStatus, ViewMode, SortKey, SortDirection, FilterType, UserRole } from '../../types';
import { useTierFeatures, TierFeatures } from '../../hooks/useTierFeatures';
import { GridIcon, TableIcon } from '../shared/icons';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { KnowledgeDrawer } from '../knowledge/KnowledgeDrawer';

// Gantt chart icon
const GanttIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h3M9 16h6" />
  </svg>
);

// Search icon component
const SearchIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

// Export/Download icon component
const DownloadIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

// Chevron down icon
const ChevronDownIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

// CSV icon
const CSVIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

// PDF icon
const PDFIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h2m-2 3h4" />
  </svg>
);

interface ControlsProps {
  filter: FilterType;
  setFilter: (filter: FilterType) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  sortKey: SortKey;
  setSortKey: (key: SortKey) => void;
  sortDirection: SortDirection;
  setSortDirection: (direction: SortDirection) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  pmFilter: string;
  setPmFilter: (pm: string) => void;
  projectManagers: string[];
  userRole: UserRole;
  focusMode: 'default' | 'pm-at-risk' | 'pm-late';
  onQuickFilterSelect: (quick: 'owner-troubled-jobs' | 'owner-weekly-revenue' | 'owner-pm-review' | 'pm-my-jobs' | 'pm-at-risk' | 'pm-late') => void;
  activeProjectManager: string;
  onActiveProjectManagerChange: (pm: string) => void;
  onExportCSV?: () => void;
  onExportPDF?: () => void;
  jobCount?: number;
  onUpgradeRequest?: (feature: keyof TierFeatures) => void;
  // Weekly Update Mode (table view ergonomics)
  weeklyUpdateMode?: boolean;
  setWeeklyUpdateMode?: (enabled: boolean) => void;
  weeklyAsOfDate?: string;
  setWeeklyAsOfDate?: (date: string) => void;
  weeklyUpdatedCount?: number;
  weeklyTotalCount?: number;
  companyId?: string | null;
  weeklyReviewAutoOpen?: boolean;
  onWeeklyReviewAutoOpenConsumed?: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  filter,
  setFilter,
  viewMode,
  setViewMode,
  sortKey,
  setSortKey,
  sortDirection,
  setSortDirection,
  searchQuery,
  setSearchQuery,
  pmFilter,
  setPmFilter,
  projectManagers,
  userRole,
  focusMode,
  onQuickFilterSelect,
  activeProjectManager,
  onActiveProjectManagerChange,
  onExportCSV,
  onExportPDF,
  jobCount = 0,
  onUpgradeRequest,
  weeklyUpdateMode = false,
  setWeeklyUpdateMode,
  weeklyAsOfDate,
  setWeeklyAsOfDate,
  weeklyUpdatedCount,
  weeklyTotalCount,
  companyId,
  weeklyReviewAutoOpen,
  onWeeklyReviewAutoOpenConsumed,
}) => {
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const tierFeatures = useTierFeatures();
  const [isWeeklyReviewOpen, setIsWeeklyReviewOpen] = useState(true);
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);
  const [knowledgeDocId, setKnowledgeDocId] = useState<string | null>(null);

  type WeeklyAction = { text: string; owner: string; dueDate: string };
  const weeklyActionsKey = useMemo(() => {
    const cid = companyId || 'default';
    const date = weeklyAsOfDate || 'no-date';
    return `wip-weekly-review-actions:${cid}:${date}`;
  }, [companyId, weeklyAsOfDate]);

  const [weeklyActions, setWeeklyActions] = useLocalStorage<WeeklyAction[]>(weeklyActionsKey, [
    { text: '', owner: '', dueDate: '' },
    { text: '', owner: '', dueDate: '' },
    { text: '', owner: '', dueDate: '' },
  ]);

  const openKnowledge = (docId: string) => {
    setKnowledgeDocId(docId);
    setKnowledgeOpen(true);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const statusOptions: JobStatus[] = [JobStatus.Draft, JobStatus.Future, JobStatus.Active, JobStatus.OnHold, JobStatus.Completed, JobStatus.Archived];
  const activePmForFilter = activeProjectManager || 'all';
  const pmRoster = projectManagers.filter(pm => pm !== 'all');

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [key, direction] = e.target.value.split('-') as [SortKey, SortDirection];
    setSortKey(key);
    setSortDirection(direction);
  };

  const showJobControls = filter !== 'company' && filter !== 'forecast' && filter !== 'reports';
  const isJobsView = filter !== 'company' && filter !== 'forecast' && filter !== 'reports' && filter !== 'weekly';
  const isWeeklyView = filter === 'weekly';

  const pmMyJobsActive = userRole === 'projectManager' && focusMode === 'default' && filter === JobStatus.Active && pmFilter === activePmForFilter;
  const pmAtRiskActive = userRole === 'projectManager' && focusMode === 'pm-at-risk';
  const pmLateActive = userRole === 'projectManager' && focusMode === 'pm-late';

  const showWeeklyReviewPanel = filter === 'weekly' || (viewMode === 'table' && weeklyUpdateMode);
  const isAsOfSet = !!weeklyAsOfDate;
  const isWeeklyInputsComplete =
    typeof weeklyUpdatedCount === 'number' &&
    typeof weeklyTotalCount === 'number' &&
    weeklyTotalCount > 0 &&
    weeklyUpdatedCount >= weeklyTotalCount;

  useEffect(() => {
    if (weeklyReviewAutoOpen && showWeeklyReviewPanel) {
      setIsWeeklyReviewOpen(true);
      onWeeklyReviewAutoOpenConsumed?.();
    }
  }, [weeklyReviewAutoOpen, showWeeklyReviewPanel, onWeeklyReviewAutoOpenConsumed]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* ============================================ */}
      {/* ROW 1: Primary Navigation - Views & Search */}
      {/* ============================================ */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: View Tabs */}
          <div className="flex items-center gap-2" data-tour="view-tabs">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mr-2">View:</span>
            <div className="flex items-center bg-white dark:bg-gray-700 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-600">
              <button
                onClick={() => setFilter(JobStatus.Active)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${isJobsView
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
              >
                Jobs
              </button>
              <button
                onClick={() => setFilter('company')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${filter === 'company'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
              >
                Company
              </button>
              <button
                onClick={() => setFilter('forecast')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${filter === 'forecast'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
              >
                Forecast
              </button>
              <button
                onClick={() => setFilter('weekly')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${filter === 'weekly'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
              >
                Weekly Review
              </button>
              <button
                onClick={() => {
                  if (tierFeatures.canUseReportsView) {
                    setFilter('reports');
                  } else if (onUpgradeRequest) {
                    onUpgradeRequest('canUseReportsView');
                  }
                }}
                className={`relative px-4 py-2 text-sm font-medium rounded-md transition-all ${filter === 'reports'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  } ${!tierFeatures.canUseReportsView ? 'opacity-75' : ''}`}
              >
                Reports
                {!tierFeatures.canUseReportsView && (
                  <span className="ml-1 text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded-full">Pro</span>
                )}
              </button>
            </div>
          </div>

          {/* Right: Search & View Toggle */}
          <div className="flex items-center gap-3">
            {showJobControls && (
              <>
                {/* Search */}
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    id="search"
                    placeholder="Search jobs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 w-48 lg:w-64 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                {/* View Toggle */}
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 p-1 rounded-lg" data-tour="view-toggle">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-600 text-orange-500 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      }`}
                    aria-label="Grid view"
                  >
                    <GridIcon />
                  </button>
                  <button
                    onClick={() => {
                      if (tierFeatures.canUseTableView) {
                        setViewMode('table');
                      } else if (onUpgradeRequest) {
                        onUpgradeRequest('canUseTableView');
                      }
                    }}
                    className={`p-2 rounded-md transition-all ${viewMode === 'table'
                      ? 'bg-white dark:bg-gray-600 text-orange-500 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      } ${!tierFeatures.canUseTableView ? 'opacity-50' : ''}`}
                    aria-label="Table view"
                    title={tierFeatures.canUseTableView ? 'Table view' : tierFeatures.getUpgradeMessage('canUseTableView')}
                  >
                    <TableIcon />
                    {!tierFeatures.canUseTableView && <span className="sr-only">Pro only</span>}
                  </button>
                  <button
                    onClick={() => {
                      if (tierFeatures.canUseGanttView) {
                        setViewMode('gantt');
                      } else if (onUpgradeRequest) {
                        onUpgradeRequest('canUseGanttView');
                      }
                    }}
                    disabled={!tierFeatures.canUseGanttView}
                    className={`p-2 rounded-md transition-all ${viewMode === 'gantt'
                      ? 'bg-white dark:bg-gray-600 text-orange-500 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      } ${!tierFeatures.canUseGanttView ? 'opacity-50 cursor-not-allowed' : ''}`}
                    aria-label="Gantt chart view"
                    title={tierFeatures.canUseGanttView ? 'Gantt Chart' : tierFeatures.getUpgradeMessage('canUseGanttView')}
                  >
                    <GanttIcon />
                    {!tierFeatures.canUseGanttView && <span className="sr-only">Pro only</span>}
                  </button>
                </div>

                {/* Export Dropdown */}
                {(onExportCSV || onExportPDF) && (
                  <div className="relative" ref={exportDropdownRef} data-tour="export-button">
                    <button
                      onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-green-400 hover:text-green-600 dark:hover:text-green-400 transition-all"
                      title={`Export ${jobCount} jobs`}
                    >
                      <DownloadIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Export</span>
                      {jobCount > 0 && (
                        <span className="hidden lg:inline text-xs text-gray-500 dark:text-gray-400">({jobCount})</span>
                      )}
                      <ChevronDownIcon className={`w-3 h-3 transition-transform ${exportDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {exportDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                        {onExportCSV && (
                          <button
                            onClick={() => {
                              onExportCSV();
                              setExportDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <CSVIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                            <div className="text-left">
                              <div className="font-medium">Export to CSV</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Spreadsheet format</div>
                            </div>
                          </button>
                        )}
                        {onExportPDF && (
                          <button
                            onClick={() => {
                              onExportPDF();
                              setExportDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <PDFIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                            <div className="text-left">
                              <div className="font-medium">Export to PDF</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Printable report</div>
                            </div>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* ROW 2: Status Filters (Only for Jobs View) */}
      {/* ============================================ */}
      {isJobsView && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Status Pills */}
            <div className="flex items-center gap-2 flex-wrap" data-tour="status-pills">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mr-1">Status:</span>
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${filter === status
                    ? status === JobStatus.Draft ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 ring-2 ring-slate-400 border-dashed' :
                      status === JobStatus.Future ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 ring-2 ring-purple-400' :
                        status === JobStatus.Active ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 ring-2 ring-blue-400' :
                          status === JobStatus.OnHold ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 ring-2 ring-yellow-400' :
                            status === JobStatus.Completed ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 ring-2 ring-green-400' :
                              'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300 ring-2 ring-gray-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Filters & Sort */}
            <div className="flex items-center gap-3">
              {/* PM Filter */}
              <div className="flex items-center gap-2">
                <label htmlFor="pm-filter" className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">PM:</label>
                <select
                  id="pm-filter"
                  value={pmFilter}
                  onChange={(e) => setPmFilter(e.target.value)}
                  className="text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer"
                >
                  {projectManagers.map(pm => (
                    <option key={pm} value={pm}>{pm === 'all' ? 'All PMs' : pm}</option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="hidden sm:flex items-center gap-2">
                <label htmlFor="sort" className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Sort:</label>
                <select
                  id="sort"
                  value={`${sortKey}-${sortDirection}`}
                  onChange={handleSortChange}
                  className="text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer"
                >
                  <option value="jobNo-asc">Job # (Asc)</option>
                  <option value="jobNo-desc">Job # (Desc)</option>
                  <option value="jobName-asc">Name (A-Z)</option>
                  <option value="jobName-desc">Name (Z-A)</option>
                  <option value="startDate-desc">Newest</option>
                  <option value="startDate-asc">Oldest</option>
                </select>
              </div>

              {/* Weekly Review Tab - As-Of Date Controls (always visible on weekly tab) */}
              {filter === 'weekly' && weeklyAsOfDate !== undefined && setWeeklyAsOfDate && (
                <div className="hidden lg:flex items-center gap-3 pl-3 ml-3 border-l border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <label htmlFor="weekly-asof" className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      As Of:
                    </label>
                    <input
                      id="weekly-asof"
                      type="date"
                      value={weeklyAsOfDate}
                      onChange={(e) => setWeeklyAsOfDate(e.target.value)}
                      className="text-sm border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    {typeof weeklyUpdatedCount === 'number' && typeof weeklyTotalCount === 'number' && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Updated: <span className="font-semibold text-gray-700 dark:text-gray-200">{weeklyUpdatedCount}</span>/{weeklyTotalCount}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Weekly Update Mode toggle (table view only, not needed on Weekly Review tab) */}
              {filter !== 'weekly' && viewMode === 'table' && setWeeklyUpdateMode && (
                <div className="hidden lg:flex items-center gap-3 pl-3 ml-3 border-l border-gray-200 dark:border-gray-700">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={weeklyUpdateMode}
                      onChange={(e) => setWeeklyUpdateMode(e.target.checked)}
                      className="rounded border-gray-300 dark:border-gray-600 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Weekly Update Mode
                    </span>
                  </label>

                  {weeklyUpdateMode && weeklyAsOfDate !== undefined && setWeeklyAsOfDate && (
                    <div className="flex items-center gap-2">
                      <label htmlFor="weekly-asof-table" className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        As Of:
                      </label>
                      <input
                        id="weekly-asof-table"
                        type="date"
                        value={weeklyAsOfDate}
                        onChange={(e) => setWeeklyAsOfDate(e.target.value)}
                        className="text-sm border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                      {typeof weeklyUpdatedCount === 'number' && typeof weeklyTotalCount === 'number' && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Updated: <span className="font-semibold text-gray-700 dark:text-gray-200">{weeklyUpdatedCount}</span>/{weeklyTotalCount}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Weekly WIP Review (List View + Weekly Update Mode only) */}
          {showWeeklyReviewPanel && (
            <div className="mt-4">
              <div className="bg-amber-50/70 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsWeeklyReviewOpen((v) => !v)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                >
                  <div className="text-left">
                    <div className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                      Weekly WIP Review
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      A 5-step weekly routine to protect margin and cash
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Educational guidance only. Verify with your CPA/legal counsel before relying on this for reporting, tax, or contract decisions.
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                    {isWeeklyInputsComplete ? 'Ready' : 'In progress'}
                  </div>
                </button>

                {isWeeklyReviewOpen && (
                  <div className="px-4 pb-4 space-y-3">
                    {/* Owner's Weekly Agenda */}
                    {userRole === 'owner' && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-3 mb-2">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                            <span className="text-lg">👑</span>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              Owner's Weekly Agenda
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 space-y-1">
                              <p>✓ <strong>Review PM Scorecard</strong> in Company view - identify who needs support</p>
                              <p>✓ <strong>Check Needs Attention queue</strong> - which PMs have the most troubled jobs?</p>
                              <p>✓ <strong>Spot patterns</strong> - chronic underbilling? Margin fade across multiple PMs?</p>
                              <p>✓ <strong>Schedule 1:1s</strong> - meet with PMs who have 2+ jobs needing attention</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 1 */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-amber-100 dark:border-amber-900/30 p-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Step 1
                          </div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            Confirm your As-Of date
                            {isAsOfSet ? (
                              <span className="ml-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">Complete</span>
                            ) : (
                              <span className="ml-2 text-xs font-semibold text-red-600 dark:text-red-400">Missing</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            WIP is point-in-time. The As-Of date is the anchor for weekly reporting and comparisons.
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => openKnowledge('01_Foundations/What_WIP_Is')}
                          className="text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline"
                        >
                          Learn why
                        </button>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-amber-100 dark:border-amber-900/30 p-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Step 2
                          </div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            Update weekly inputs (Costs + CTC + Invoiced)
                            {isWeeklyInputsComplete ? (
                              <span className="ml-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">Complete</span>
                            ) : (
                              <span className="ml-2 text-xs font-semibold text-amber-700 dark:text-amber-300">Work the list</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Keep updates small and weekly. Big month-end swings are usually stale forecasts.
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => openKnowledge('02_Mechanics/Cost_to_Complete')}
                          className="text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline"
                        >
                          Learn why
                        </button>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-amber-100 dark:border-amber-900/30 p-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Step 3
                          </div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            Billing position quick check (cash risk)
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Watch for chronic underbilling, or overbilling that is growing while production slows.
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => openKnowledge('02_Mechanics/Overbilling_Underbilling')}
                          className="text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline"
                        >
                          Learn why
                        </button>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-amber-100 dark:border-amber-900/30 p-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Step 4
                          </div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            Margin drift / warning signs quick check
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Identify which jobs need action this week before margin loss becomes irreversible.
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => openKnowledge('03_Reading_the_WIP/Warning_Signs')}
                          className="text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline"
                        >
                          Learn why
                        </button>
                      </div>
                    </div>

                    {/* Step 5 */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-amber-100 dark:border-amber-900/30 p-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Step 5
                          </div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            Set your Top 3 actions (owner + due date)
                          </div>
                          <div className="mt-2 space-y-2">
                            {weeklyActions.map((a, idx) => (
                              <div key={idx} className="grid grid-cols-1 lg:grid-cols-6 gap-2">
                                <input
                                  value={a.text}
                                  onChange={(e) =>
                                    setWeeklyActions((prev) => {
                                      const next = [...prev];
                                      next[idx] = { ...next[idx], text: e.target.value };
                                      return next;
                                    })
                                  }
                                  placeholder={`Action ${idx + 1} (what will change?)`}
                                  className="lg:col-span-3 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                                <input
                                  value={a.owner}
                                  onChange={(e) =>
                                    setWeeklyActions((prev) => {
                                      const next = [...prev];
                                      next[idx] = { ...next[idx], owner: e.target.value };
                                      return next;
                                    })
                                  }
                                  placeholder="Owner"
                                  className="lg:col-span-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                                <input
                                  type="date"
                                  value={a.dueDate}
                                  onChange={(e) =>
                                    setWeeklyActions((prev) => {
                                      const next = [...prev];
                                      next[idx] = { ...next[idx], dueDate: e.target.value };
                                      return next;
                                    })
                                  }
                                  className="lg:col-span-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => openKnowledge('05_Decision_Making/When_to_Push_Collections')}
                          className="text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline"
                        >
                          Learn why
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <KnowledgeDrawer
                isOpen={knowledgeOpen}
                onClose={() => setKnowledgeOpen(false)}
                initialDocId={knowledgeDocId}
              />
            </div>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* ROW 3: Quick Actions (Role-specific) */}
      {/* ============================================ */}
      {(userRole === 'owner' || userRole === 'projectManager' || userRole === 'estimator') && (
        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Quick Actions:</span>

            {userRole === 'owner' && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => onQuickFilterSelect('owner-troubled-jobs')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                    filter === JobStatus.Active && viewMode === 'grid' && focusMode === 'default'
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-red-400 hover:text-red-600 dark:hover:text-red-400'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Troubled Jobs
                </button>
                <button
                  onClick={() => onQuickFilterSelect('owner-weekly-revenue')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                    filter === 'company'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-green-400 hover:text-green-600 dark:hover:text-green-400'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Weekly Revenue
                </button>
                <button
                  onClick={() => onQuickFilterSelect('owner-pm-review')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                    filter === 'company'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  PM Review
                </button>
              </div>
            )}

            {userRole === 'projectManager' && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* PM Selector */}
                <div className="flex items-center gap-2 bg-white dark:bg-gray-700 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600">
                  <label htmlFor="pm-profile" className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Viewing as:</label>
                  <select
                    id="pm-profile"
                    value={activeProjectManager}
                    onChange={(e) => onActiveProjectManagerChange(e.target.value)}
                    className="text-sm bg-transparent text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer font-medium"
                  >
                    <option value="">All PMs</option>
                    {pmRoster.map(pm => (
                      <option key={pm} value={pm}>{pm}</option>
                    ))}
                  </select>
                </div>

                {/* Quick Filters */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => onQuickFilterSelect('pm-my-jobs')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${pmMyJobsActive
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:text-blue-600'
                      }`}
                  >
                    My Jobs
                  </button>
                  <button
                    onClick={() => onQuickFilterSelect('pm-at-risk')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${pmAtRiskActive
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-red-400 hover:text-red-600'
                      }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    At-Risk Margin
                  </button>
                  <button
                    onClick={() => onQuickFilterSelect('pm-late')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${pmLateActive
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-md'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-yellow-400 hover:text-yellow-600'
                      }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    Behind Schedule
                  </button>
                </div>
              </div>
            )}

            {userRole === 'estimator' && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/30 px-4 py-2 rounded-lg border border-purple-200 dark:border-purple-700">
                  <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    Viewing jobs where you are the assigned estimator
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-semibold text-purple-600 dark:text-purple-400">Tip:</span> You can edit Future jobs only
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Controls;