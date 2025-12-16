import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAuditLog } from '../hooks';
import { AuditLogEntry, AuditLogFilters, AuditEntityType, AuditAction, AUDIT_FIELD_LABELS } from '../types';

/**
 * Format a date for display
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Check if it's today
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }

  // Check if it's yesterday
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  // Otherwise format as "Month Day, Year"
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a timestamp for display
 */
function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format a value for display based on field type
 */
function formatValue(value: any, field: string): string {
  if (value === null || value === undefined) {
    return '—';
  }

  // Format currency fields
  if (
    field.includes('labor') ||
    field.includes('material') ||
    field.includes('other') ||
    field.includes('profit') ||
    field.includes('budget') ||
    field.includes('contract') ||
    field.includes('cost')
  ) {
    const num = Number(value);
    if (isNaN(num)) return String(value);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  }

  return String(value);
}

/**
 * Group audit log entries by date
 */
function groupByDate(entries: AuditLogEntry[]): Array<{ date: string; entries: AuditLogEntry[] }> {
  const groups: Record<string, AuditLogEntry[]> = {};

  entries.forEach(entry => {
    const date = entry.changedAt.split('T')[0]; // Get date part only
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
  });

  return Object.keys(groups)
    .sort((a, b) => b.localeCompare(a)) // Sort dates descending
    .map(date => ({
      date,
      entries: groups[date].sort(
        (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
      ),
    }));
}

/**
 * Format a human-readable description of a change
 */
function formatChangeDescription(entry: AuditLogEntry): string {
  const userName = entry.changedByEmail?.split('@')[0] || 'Unknown User';
  const time = formatTime(entry.changedAt);

  if (entry.action === 'create') {
    return `${userName} created ${entry.entityType === 'job' ? 'job' : 'change order'} ${entry.entityName} at ${time}`;
  }

  if (entry.action === 'delete') {
    return `${userName} deleted ${entry.entityType === 'job' ? 'job' : 'change order'} ${entry.entityName} at ${time}`;
  }

  // Update action - describe the changes
  if (entry.changes.length === 0) {
    return `${userName} updated ${entry.entityName} at ${time}`;
  }

  if (entry.changes.length === 1) {
    const change = entry.changes[0];
    const label = change.label || AUDIT_FIELD_LABELS[change.field] || change.field;
    const oldVal = formatValue(change.old, change.field);
    const newVal = formatValue(change.new, change.field);
    return `${label} changed from ${oldVal} → ${newVal} by ${userName} at ${time}`;
  }

  // Multiple changes
  const firstChange = entry.changes[0];
  const label = firstChange.label || AUDIT_FIELD_LABELS[firstChange.field] || firstChange.field;
  const remainingCount = entry.changes.length - 1;
  return `${label} and ${remainingCount} other field${remainingCount === 1 ? '' : 's'} updated by ${userName} at ${time}`;
}

interface ActivityLogPageProps {
  onClose?: () => void;
}

const ActivityLogPage: React.FC<ActivityLogPageProps> = ({ onClose }) => {
  const { companyId } = useAuth();
  const { entries, loading, error, fetchAuditLog } = useAuditLog(companyId);

  // Filter state
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Load audit log on mount and when filters change
  useEffect(() => {
    if (companyId) {
      const debounceTimer = setTimeout(() => {
        fetchAuditLog({
          ...filters,
          searchQuery: searchQuery || undefined,
        });
      }, 300);

      return () => clearTimeout(debounceTimer);
    }
  }, [companyId, filters, searchQuery, fetchAuditLog]);

  // Group entries by date
  const groupedEntries = useMemo(() => groupByDate(entries), [entries]);

  const handleEntityTypeFilter = (entityType: AuditEntityType | null) => {
    setFilters(prev => ({ ...prev, entityType: entityType || undefined }));
  };

  const handleActionFilter = (action: AuditAction | null) => {
    setFilters(prev => ({ ...prev, action: action || undefined }));
  };

  const handleDateRangeFilter = (startDate: string | null, endDate: string | null) => {
    setFilters(prev => ({
      ...prev,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex items-center justify-between">
            <div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="text-sm">Back</span>
                </button>
              )}
              <h1 className="text-3xl sm:text-4xl font-bold mb-3">Activity Log</h1>
              <p className="text-slate-300 text-lg">
                Track all changes to jobs and change orders. See who changed what and when.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
          {/* Search */}
          <div className="relative mb-4">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by job name, job number, or CO number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-3">
            {/* Entity Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Type:</span>
              <button
                onClick={() => handleEntityTypeFilter(null)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  !filters.entityType
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleEntityTypeFilter('job')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filters.entityType === 'job'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Jobs
              </button>
              <button
                onClick={() => handleEntityTypeFilter('change_order')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filters.entityType === 'change_order'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Change Orders
              </button>
            </div>

            {/* Action Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Action:</span>
              <button
                onClick={() => handleActionFilter(null)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  !filters.action
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleActionFilter('create')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filters.action === 'create'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Created
              </button>
              <button
                onClick={() => handleActionFilter('update')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filters.action === 'update'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Updated
              </button>
              <button
                onClick={() => handleActionFilter('delete')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filters.action === 'delete'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Deleted
              </button>
            </div>

            {/* Date Range (simple implementation - can be enhanced with date pickers) */}
            <div className="flex items-center gap-2 ml-auto">
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleDateRangeFilter(e.target.value || null, filters.endDate || null)}
                className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                placeholder="Start date"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleDateRangeFilter(filters.startDate || null, e.target.value || null)}
                className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                placeholder="End date"
              />
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          {loading ? 'Loading...' : `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`}
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && entries.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No activity found
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedEntries.map(group => (
              <div key={group.date}>
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatDate(group.date)}
                  </span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                </div>

                {/* Entries for this date */}
                <div className="space-y-3">
                  {group.entries.map(entry => (
                    <div
                      key={entry.id}
                      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
                    >
                      {/* Main description */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 dark:text-white font-medium">
                            {formatChangeDescription(entry)}
                          </p>
                        </div>
                        <span className={`ml-4 px-2 py-1 rounded-full text-xs font-medium ${
                          entry.action === 'create'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : entry.action === 'update'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {entry.action}
                        </span>
                      </div>

                      {/* Detailed changes for updates */}
                      {entry.action === 'update' && entry.changes.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                          <details className="group">
                            <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                              {entry.changes.length} field{entry.changes.length === 1 ? '' : 's'} changed
                              <span className="ml-2 inline-block transform transition-transform group-open:rotate-90">
                                ▶
                              </span>
                            </summary>
                            <div className="mt-2 space-y-2 pl-4">
                              {entry.changes.map((change, idx) => {
                                const label = change.label || AUDIT_FIELD_LABELS[change.field] || change.field;
                                const oldVal = formatValue(change.old, change.field);
                                const newVal = formatValue(change.new, change.field);
                                return (
                                  <div key={idx} className="text-sm">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{label}:</span>{' '}
                                    <span className="text-gray-500 dark:text-gray-400">{oldVal}</span>
                                    <span className="mx-2 text-gray-400">→</span>
                                    <span className="text-gray-900 dark:text-white font-medium">{newVal}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </details>
                        </div>
                      )}

                      {/* Entity link/name */}
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {entry.entityName}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogPage;

