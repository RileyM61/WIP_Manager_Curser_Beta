/**
 * Change Log Entry Component
 * 
 * Displays a single changelog entry with expandable "Why it matters" section.
 */

import React, { useState } from 'react';
import { ChangeLogEntry as ChangeLogEntryType, ACTION_REQUIRED_CONFIG } from '../../types/changelog';
import CategoryBadge from './CategoryBadge';

interface ChangeLogEntryProps {
  entry: ChangeLogEntryType;
  /** If true, shows a more compact version for the drawer */
  compact?: boolean;
  /** If true, "Why it matters" is expanded by default */
  defaultExpanded?: boolean;
}

const ChangeLogEntry: React.FC<ChangeLogEntryProps> = ({
  entry,
  compact = false,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const actionConfig = ACTION_REQUIRED_CONFIG[entry.actionRequired];

  if (compact) {
    // Compact version for "What's New" drawer
    return (
      <div className="py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
        <div className="flex items-start gap-3">
          <CategoryBadge category={entry.category} size="sm" />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {entry.title}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {entry.summary}
            </p>
            {actionConfig.show && (
              <div className={`mt-2 text-xs px-2 py-1 rounded inline-block ${actionConfig.bgColor} ${actionConfig.color}`}>
                {actionConfig.label}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full version for Change Log page
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CategoryBadge category={entry.category} />
              {entry.version && (
                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  v{entry.version}
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {entry.title}
            </h3>
          </div>
        </div>
        
        {/* Summary */}
        <p className="text-gray-700 dark:text-gray-300 mt-3">
          {entry.summary}
        </p>

        {/* Action Required Banner */}
        {actionConfig.show && (
          <div className={`mt-4 px-4 py-3 rounded-lg ${actionConfig.bgColor}`}>
            <div className="flex items-start gap-2">
              <span className={`font-medium ${actionConfig.color}`}>
                {actionConfig.label}
              </span>
            </div>
            {entry.actionDescription && (
              <p className={`mt-1 text-sm ${actionConfig.color} opacity-90`}>
                {entry.actionDescription}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Why It Matters - Collapsible */}
      <div className="border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Why this matters
          </span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isExpanded && (
          <div className="px-5 pb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {entry.whyItMatters}
            </p>
          </div>
        )}
      </div>

      {/* Tags */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {entry.tags.map(tag => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangeLogEntry;

