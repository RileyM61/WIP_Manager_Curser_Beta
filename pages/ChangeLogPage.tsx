/**
 * Change Log Page
 * 
 * Public page showing all product updates and changes.
 * Accessible at /changelog without authentication.
 */

import React, { useState, useMemo } from 'react';
import { ChangeLogEntry, CategoryBadge } from '../components/changelog';
import {
  getPublicEntries,
  groupByDate,
  filterEntries,
  getCategories,
  formatDate,
} from '../lib/changelog';
import { ChangeCategory, ChangeLogFilters } from '../types/changelog';

const ChangeLogPage: React.FC = () => {
  const [filters, setFilters] = useState<ChangeLogFilters>({});
  const allEntries = useMemo(() => getPublicEntries(), []);
  const categories = getCategories();

  // Apply filters
  const filteredEntries = useMemo(
    () => filterEntries(allEntries, filters),
    [allEntries, filters]
  );

  // Group by date
  const groupedEntries = useMemo(
    () => groupByDate(filteredEntries),
    [filteredEntries]
  );

  const handleCategoryFilter = (category: ChangeCategory | undefined) => {
    setFilters(prev => ({ ...prev, category }));
  };

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query || undefined }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex items-center gap-3 mb-2">
            <a
              href="/"
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </a>
            <span className="text-slate-400 text-sm">Back to WIP Insights</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Change Log</h1>
          <p className="text-slate-300 text-lg">
            See what's new, improved, and fixed in WIP Insights.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-4xl mx-auto px-4 py-6">
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
              placeholder="Search updates..."
              value={filters.searchQuery || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCategoryFilter(undefined)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !filters.category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filters.category === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          {filteredEntries.length} {filteredEntries.length === 1 ? 'update' : 'updates'}
          {filters.category && ` in ${filters.category}`}
          {filters.searchQuery && ` matching "${filters.searchQuery}"`}
        </div>

        {/* Entries */}
        {groupedEntries.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No updates found
              {filters.searchQuery && ` matching "${filters.searchQuery}"`}
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
                <div className="space-y-4">
                  {group.entries.map(entry => (
                    <ChangeLogEntry
                      key={entry.id}
                      entry={entry}
                      defaultExpanded={false}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Have feedback or a feature request?
          </p>
          <a
            href="mailto:support@wip-insights.com"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
};

export default ChangeLogPage;

