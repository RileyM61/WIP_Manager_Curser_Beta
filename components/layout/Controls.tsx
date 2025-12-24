import React, { useState, useRef, useEffect, useMemo } from 'react';
import { JobStatus, ViewMode, SortKey, SortDirection, FilterType, UserRole } from '../../types';
import { useTierFeatures, TierFeatures } from '../../hooks/useTierFeatures';
import { GridIcon, TableIcon } from '../shared/icons';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { KnowledgeDrawer } from '../knowledge/KnowledgeDrawer';

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
  // Weekly Update Mode
  weeklyUpdateMode?: boolean;
  setWeeklyUpdateMode?: (enabled: boolean) => void;
  weeklyAsOfDate?: string;
  setWeeklyAsOfDate?: (date: string) => void;
  weeklyUpdatedCount?: number;
  weeklyTotalCount?: number;
  companyId?: string | null;
  weeklyReviewAutoOpen?: boolean;
  onWeeklyReviewAutoOpenConsumed?: () => void;
  // Owner-as-PM settings
  ownerIsAlsoPm?: boolean;
  ownerPmName?: string;
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
  ownerIsAlsoPm = false,
  ownerPmName,
}) => {
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
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

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [key, direction] = e.target.value.split('-') as [SortKey, SortDirection];
    setSortKey(key);
    setSortDirection(direction);
  };

  const showJobControls = filter !== 'company' && filter !== 'forecast' && filter !== 'reports';
  const isJobsView = filter !== 'company' && filter !== 'forecast' && filter !== 'reports' && filter !== 'weekly';
  const isWeeklyView = filter === 'weekly';

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

  // Get status color classes with improved hierarchy
  const getStatusClasses = (status: JobStatus, isActive: boolean) => {
    if (!isActive) {
      return 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600';
    }
    
    switch (status) {
      case JobStatus.Draft:
        return 'border-slate-400 bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300';
      case JobStatus.Future:
        return 'border-purple-400 bg-purple-50 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300';
      case JobStatus.Active:
        return 'border-blue-400 bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300';
      case JobStatus.OnHold:
        return 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300';
      case JobStatus.Completed:
        return 'border-green-400 bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300';
      case JobStatus.Archived:
        return 'border-gray-400 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* ============================================ */}
      {/* ROW 1: Primary Navigation - Views & Search */}
      {/* ============================================ */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left: View Tabs - Clean underline style */}
            <div className="flex items-center" data-tour="view-tabs">
              <nav className="flex items-center gap-1">
                {[
                  { key: 'jobs', label: 'Jobs', filter: JobStatus.Active, isActive: isJobsView },
                  { key: 'company', label: 'Company', filter: 'company' as FilterType, isActive: filter === 'company' },
                  { key: 'forecast', label: 'Forecast', filter: 'forecast' as FilterType, isActive: filter === 'forecast' },
                  { key: 'weekly', label: 'Weekly Review', filter: 'weekly' as FilterType, isActive: filter === 'weekly' },
                  { key: 'reports', label: 'Reports', filter: 'reports' as FilterType, isActive: filter === 'reports', isPro: !tierFeatures.canUseReportsView },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      if (tab.isPro && onUpgradeRequest) {
                        onUpgradeRequest('canUseReportsView');
                      } else {
                        setFilter(tab.filter);
                      }
                    }}
                    className={`
                      relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                      ${tab.isActive 
                        ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }
                      ${tab.isPro ? 'opacity-75' : ''}
                      active:scale-95
                    `}
                  >
                    {tab.label}
                    {tab.isPro && (
                      <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-orange-500 text-white rounded">PRO</span>
                    )}
                    {/* Active indicator line */}
                    {tab.isActive && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-orange-500 rounded-full" />
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Right: Search & View Toggle */}
            <div className="flex items-center gap-3">
              {showJobControls && (
                <>
                  {/* Search - Expandable on focus */}
                  <div className={`relative transition-all duration-200 ${searchFocused ? 'w-64' : 'w-48'}`}>
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search jobs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setSearchFocused(false)}
                      className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* View Toggle - Subtle buttons */}
                  <div className="flex items-center bg-gray-100 dark:bg-gray-700 p-1 rounded-lg" data-tour="view-toggle">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'grid'
                        ? 'bg-white dark:bg-gray-600 text-orange-500 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      } active:scale-95`}
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
                      className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'table'
                        ? 'bg-white dark:bg-gray-600 text-orange-500 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      } ${!tierFeatures.canUseTableView ? 'opacity-50' : ''} active:scale-95`}
                      aria-label="Table view"
                      title={tierFeatures.canUseTableView ? 'Table view' : tierFeatures.getUpgradeMessage('canUseTableView')}
                    >
                      <TableIcon />
                    </button>
                  </div>

                  {/* Export - Ghost button style */}
                  {(onExportCSV || onExportPDF) && (
                    <div className="relative" ref={exportDropdownRef} data-tour="export-button">
                      <button
                        onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all active:scale-95"
                        title={`Export ${jobCount} jobs`}
                      >
                        <DownloadIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Export</span>
                        <ChevronDownIcon className={`w-3 h-3 transition-transform ${exportDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Dropdown Menu */}
                      {exportDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                          {onExportCSV && (
                            <button
                              onClick={() => {
                                onExportCSV();
                                setExportDropdownOpen(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span>Export to CSV</span>
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
                              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              <span>Export to PDF</span>
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
        {/* ROW 2: Contextual Filters (Jobs View Only) */}
        {/* ============================================ */}
        {isJobsView && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Status Pills - Subtle outline style */}
              <div className="flex items-center gap-1.5 flex-wrap" data-tour="status-pills">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`
                      px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200
                      ${getStatusClasses(status, filter === status)}
                      active:scale-95
                    `}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* Secondary Controls - Even more subtle */}
              <div className="flex items-center gap-4 text-sm">
                {/* PM Filter */}
                <div className="flex items-center gap-2">
                  <label htmlFor="pm-filter" className="text-xs text-gray-500 dark:text-gray-400">PM:</label>
                  <select
                    id="pm-filter"
                    value={pmFilter}
                    onChange={(e) => setPmFilter(e.target.value)}
                    className="text-sm text-gray-700 dark:text-gray-300 bg-transparent border-0 focus:outline-none focus:ring-0 cursor-pointer hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                  >
                    {projectManagers.map(pm => (
                      <option key={pm} value={pm}>{pm === 'all' ? 'All' : pm}</option>
                    ))}
                  </select>
                </div>

                {/* Sort - Hidden on mobile */}
                <div className="hidden sm:flex items-center gap-2">
                  <label htmlFor="sort" className="text-xs text-gray-500 dark:text-gray-400">Sort:</label>
                  <select
                    id="sort"
                    value={`${sortKey}-${sortDirection}`}
                    onChange={handleSortChange}
                    className="text-sm text-gray-700 dark:text-gray-300 bg-transparent border-0 focus:outline-none focus:ring-0 cursor-pointer hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                  >
                    <option value="jobNo-asc">Job # ↑</option>
                    <option value="jobNo-desc">Job # ↓</option>
                    <option value="jobName-asc">Name A-Z</option>
                    <option value="jobName-desc">Name Z-A</option>
                    <option value="startDate-desc">Newest</option>
                    <option value="startDate-asc">Oldest</option>
                  </select>
                </div>

                {/* Weekly Update Mode toggle */}
                {viewMode === 'table' && setWeeklyUpdateMode && (
                  <label className="hidden lg:inline-flex items-center gap-2 cursor-pointer select-none text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={weeklyUpdateMode}
                      onChange={(e) => setWeeklyUpdateMode(e.target.checked)}
                      className="rounded border-gray-300 dark:border-gray-600 text-orange-600 focus:ring-orange-500 w-4 h-4"
                    />
                    <span className="text-xs">Weekly Mode</span>
                  </label>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Weekly Review As-Of Date (for weekly view or weekly mode) */}
        {(filter === 'weekly' || (viewMode === 'table' && weeklyUpdateMode)) && weeklyAsOfDate !== undefined && setWeeklyAsOfDate && (
          <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700/50 bg-amber-50/50 dark:bg-amber-900/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">As-Of Date:</span>
                <input
                  type="date"
                  value={weeklyAsOfDate}
                  onChange={(e) => setWeeklyAsOfDate(e.target.value)}
                  className="text-sm border border-amber-200 dark:border-amber-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              {typeof weeklyUpdatedCount === 'number' && typeof weeklyTotalCount === 'number' && (
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${weeklyTotalCount > 0 ? (weeklyUpdatedCount / weeklyTotalCount) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-gray-900 dark:text-white">{weeklyUpdatedCount}</span>/{weeklyTotalCount}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* Weekly WIP Review Panel (Collapsible) */}
      {/* ============================================ */}
      {showWeeklyReviewPanel && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setIsWeeklyReviewOpen((v) => !v)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors"
          >
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-xl">📋</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Weekly WIP Review Checklist</span>
                {isWeeklyInputsComplete && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500 text-white rounded-full">COMPLETE</span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-7">
                5-step routine to protect margin and cash
              </p>
            </div>
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isWeeklyReviewOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isWeeklyReviewOpen && (
            <div className="px-5 pb-5 space-y-3">
              {/* Owner's Quick Tips */}
              {userRole === 'owner' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span>👑</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Owner Focus</span>
                  </div>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 ml-6">
                    <li>• Review PM Scorecard in Company view</li>
                    <li>• Check who has the most troubled jobs</li>
                    <li>• Schedule 1:1s with PMs needing support</li>
                  </ul>
                </div>
              )}

              {/* Checklist Steps */}
              {[
                { step: 1, title: 'Confirm As-Of date', done: isAsOfSet, learn: '01_Foundations/What_WIP_Is' },
                { step: 2, title: 'Update Costs + CTC + Invoiced', done: isWeeklyInputsComplete, learn: '02_Mechanics/Cost_to_Complete' },
                { step: 3, title: 'Check billing position (cash risk)', done: false, learn: '02_Mechanics/Overbilling_Underbilling' },
                { step: 4, title: 'Spot margin drift & warnings', done: false, learn: '03_Reading_the_WIP/Warning_Signs' },
              ].map((item) => (
                <div key={item.step} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      item.done 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      {item.done ? '✓' : item.step}
                    </div>
                    <span className={`text-sm ${item.done ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                      {item.title}
                    </span>
                  </div>
                  <button
                    onClick={() => openKnowledge(item.learn)}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    Learn why
                  </button>
                </div>
              ))}

              {/* Step 5: Action Items */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400">
                      5
                    </div>
                    <span className="text-sm text-gray-900 dark:text-white">Set Top 3 Actions</span>
                  </div>
                  <button
                    onClick={() => openKnowledge('05_Decision_Making/When_to_Push_Collections')}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    Learn why
                  </button>
                </div>
                <div className="space-y-2 ml-9">
                  {weeklyActions.map((a, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        value={a.text}
                        onChange={(e) =>
                          setWeeklyActions((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], text: e.target.value };
                            return next;
                          })
                        }
                        placeholder={`Action ${idx + 1}`}
                        className="flex-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                        className="w-24 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                        className="w-32 px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-2">
                Educational guidance only. Verify with your CPA/legal counsel before relying on this for reporting decisions.
              </p>
            </div>
          )}
        </div>
      )}

      <KnowledgeDrawer
        isOpen={knowledgeOpen}
        onClose={() => setKnowledgeOpen(false)}
        initialDocId={knowledgeDocId}
      />
    </div>
  );
};

export default Controls;
