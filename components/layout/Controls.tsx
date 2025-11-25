import React from 'react';
import { JobStatus, ViewMode, SortKey, SortDirection, FilterType, UserRole } from '../../types';
import { GridIcon, TableIcon } from '../shared/icons';

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
  onQuickFilterSelect: (quick: 'owner-backlog' | 'owner-capacity' | 'pm-my-jobs' | 'pm-at-risk' | 'pm-late') => void;
  activeProjectManager: string;
  onActiveProjectManagerChange: (pm: string) => void;
  onExportCSV?: () => void;
  jobCount?: number;
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
  jobCount = 0,
}) => {
  const statusOptions: JobStatus[] = [JobStatus.Future, JobStatus.Active, JobStatus.OnHold, JobStatus.Completed, JobStatus.Archived];
  const activePmForFilter = activeProjectManager || 'all';
  const pmRoster = projectManagers.filter(pm => pm !== 'all');

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [key, direction] = e.target.value.split('-') as [SortKey, SortDirection];
    setSortKey(key);
    setSortDirection(direction);
  };
  
  const showJobControls = filter !== 'company' && filter !== 'forecast';
  const isJobsView = filter !== 'company' && filter !== 'forecast';

  const ownerBacklogActive = userRole === 'owner' && filter === 'forecast' && focusMode === 'default';
  const ownerCapacityActive = userRole === 'owner' && filter === 'company' && focusMode === 'default';

  const pmMyJobsActive = userRole === 'projectManager' && focusMode === 'default' && filter === JobStatus.Active && pmFilter === activePmForFilter;
  const pmAtRiskActive = userRole === 'projectManager' && focusMode === 'pm-at-risk';
  const pmLateActive = userRole === 'projectManager' && focusMode === 'pm-late';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* ============================================ */}
      {/* ROW 1: Primary Navigation - Views & Search */}
      {/* ============================================ */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: View Tabs */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mr-2">View:</span>
            <div className="flex items-center bg-white dark:bg-gray-700 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-600">
              <button
                onClick={() => setFilter(JobStatus.Active)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  isJobsView
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                Jobs
              </button>
              <button
                onClick={() => setFilter('company')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  filter === 'company'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                Company
              </button>
              <button
                onClick={() => setFilter('forecast')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  filter === 'forecast'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                Forecast
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
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'grid' 
                        ? 'bg-white dark:bg-gray-600 text-orange-500 shadow-sm' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                    aria-label="Grid view"
                  >
                    <GridIcon />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'table' 
                        ? 'bg-white dark:bg-gray-600 text-orange-500 shadow-sm' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                    aria-label="Table view"
                  >
                    <TableIcon />
                  </button>
                </div>

                {/* Export Button */}
                {onExportCSV && (
                  <button
                    onClick={onExportCSV}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-green-400 hover:text-green-600 dark:hover:text-green-400 transition-all"
                    title={`Export ${jobCount} jobs to CSV`}
                  >
                    <DownloadIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Export</span>
                    {jobCount > 0 && (
                      <span className="hidden lg:inline text-xs text-gray-500 dark:text-gray-400">({jobCount})</span>
                    )}
                  </button>
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
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mr-1">Status:</span>
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${
                    filter === status
                      ? status === JobStatus.Future ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 ring-2 ring-purple-400' :
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
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* ROW 3: Quick Actions (Role-specific) */}
      {/* ============================================ */}
      {(userRole === 'owner' || userRole === 'projectManager') && (
        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Quick Actions:</span>
            
            {userRole === 'owner' && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => onQuickFilterSelect('owner-backlog')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                    ownerBacklogActive 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' 
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Backlog Lens
                </button>
                <button
                  onClick={() => onQuickFilterSelect('owner-capacity')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                    ownerCapacityActive 
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md' 
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Capacity Snapshot
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
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      pmMyJobsActive 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' 
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:text-blue-600'
                    }`}
                  >
                    My Jobs
                  </button>
                  <button
                    onClick={() => onQuickFilterSelect('pm-at-risk')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                      pmAtRiskActive 
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md' 
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-red-400 hover:text-red-600'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    At-Risk Margin
                  </button>
                  <button
                    onClick={() => onQuickFilterSelect('pm-late')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                      pmLateActive 
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
          </div>
        </div>
      )}
    </div>
  );
};

export default Controls;