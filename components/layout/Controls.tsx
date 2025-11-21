import React from 'react';
import { JobStatus, ViewMode, SortKey, SortDirection, FilterType, UserRole } from '../../types';
import { GridIcon, TableIcon } from '../shared/icons';

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
  focusMode: 'default' | 'pm-at-risk' | 'pm-late' | 'owner-cashflow';
  onQuickFilterSelect: (quick: 'owner-backlog' | 'owner-cashflow' | 'owner-capacity' | 'pm-my-jobs' | 'pm-at-risk' | 'pm-late') => void;
  activeProjectManager: string;
  onActiveProjectManagerChange: (pm: string) => void;
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

  const ownerBacklogActive = userRole === 'owner' && filter === 'forecast' && focusMode === 'default';
  const ownerCashflowActive = userRole === 'owner' && focusMode === 'owner-cashflow';
  const ownerCapacityActive = userRole === 'owner' && filter === 'company' && focusMode === 'default';

  const pmMyJobsActive = userRole === 'projectManager' && focusMode === 'default' && filter === JobStatus.Active && pmFilter === activePmForFilter;
  const pmAtRiskActive = userRole === 'projectManager' && focusMode === 'pm-at-risk';
  const pmLateActive = userRole === 'projectManager' && focusMode === 'pm-late';

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Filter Controls */}
      <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg flex-wrap justify-center">
        {statusOptions.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === status
                ? 'bg-brand-blue text-white shadow'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {status}
          </button>
        ))}
         <button
          onClick={() => setFilter('company')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            filter === 'company'
              ? 'bg-brand-blue text-white shadow'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Company View
        </button>
         <button
          onClick={() => setFilter('forecast')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            filter === 'forecast'
              ? 'bg-brand-blue text-white shadow'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Forecast View
        </button>
      </div>

      {userRole === 'owner' && (
        <div className="flex flex-wrap items-center justify-center gap-2 w-full">
          <button
            onClick={() => onQuickFilterSelect('owner-backlog')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              ownerBacklogActive ? 'bg-brand-blue text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Backlog Lens
          </button>
          <button
            onClick={() => onQuickFilterSelect('owner-cashflow')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              ownerCashflowActive ? 'bg-brand-blue text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Cash Flow Risks
          </button>
          <button
            onClick={() => onQuickFilterSelect('owner-capacity')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              ownerCapacityActive ? 'bg-brand-blue text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Capacity Snapshot
          </button>
        </div>
      )}

      {userRole === 'projectManager' && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-3 w-full">
          <div className="flex items-center gap-2">
            <label htmlFor="pm-profile" className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Viewing as</label>
            <select
              id="pm-profile"
              value={activeProjectManager}
              onChange={(e) => onActiveProjectManagerChange(e.target.value)}
              className="block w-full md:w-auto pl-3 pr-8 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
            >
              <option value="">All PMs</option>
              {pmRoster.map(pm => (
                <option key={pm} value={pm}>{pm}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => onQuickFilterSelect('pm-my-jobs')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                pmMyJobsActive ? 'bg-brand-blue text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              My Jobs
            </button>
            <button
              onClick={() => onQuickFilterSelect('pm-at-risk')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                pmAtRiskActive ? 'bg-red-600 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              At-Risk Margin
            </button>
            <button
              onClick={() => onQuickFilterSelect('pm-late')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                pmLateActive ? 'bg-yellow-500 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Behind Schedule
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
        {showJobControls && (
          <>
            <div className="w-full sm:w-auto">
                <label htmlFor="search" className="sr-only">Search</label>
                <input
                    type="text"
                    id="search"
                    placeholder="Search jobs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm rounded-md"
                />
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="w-full sm:w-auto">
                    <label htmlFor="pm-filter" className="sr-only">Filter by PM</label>
                    <select
                        id="pm-filter"
                        name="pm-filter"
                        value={pmFilter}
                        onChange={(e) => setPmFilter(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm rounded-md"
                    >
                        {projectManagers.map(pm => (
                            <option key={pm} value={pm}>{pm === 'all' ? 'All PMs' : pm}</option>
                        ))}
                    </select>
                </div>
                <div className="hidden sm:block">
                  <label htmlFor="sort" className="sr-only">Sort by</label>
                  <select
                    id="sort"
                    name="sort"
                    value={`${sortKey}-${sortDirection}`}
                    onChange={handleSortChange}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm rounded-md"
                  >
                    <option value="jobNo-asc">Job Number (Asc)</option>
                    <option value="jobNo-desc">Job Number (Desc)</option>
                    <option value="jobName-asc">Job Name (A-Z)</option>
                    <option value="jobName-desc">Job Name (Z-A)</option>
                    <option value="startDate-desc">Start Date (Newest)</option>
                    <option value="startDate-asc">Start Date (Oldest)</option>
                  </select>
                </div>

                <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-brand-blue text-white shadow' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                    aria-label="Grid view"
                  >
                    <GridIcon />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-brand-blue text-white shadow' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                    aria-label="Table view"
                  >
                    <TableIcon />
                  </button>
                </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Controls;