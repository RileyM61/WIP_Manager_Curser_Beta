/**
 * What's New Drawer Component
 * 
 * A slide-out drawer showing recent product changes.
 * Accessed via a header icon. Uses localStorage to track "read" status.
 */

import React, { useEffect, useMemo } from 'react';
import { Transition } from '@headlessui/react';
import { XIcon } from '../shared/icons';
import ChangeLogEntry from './ChangeLogEntry';
import {
  getInAppEntries,
  groupByDate,
  formatRelativeDate,
  markAsViewed,
} from '../../lib/changelog';

interface WhatsNewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const WhatsNewDrawer: React.FC<WhatsNewDrawerProps> = ({ isOpen, onClose }) => {
  // Get recent entries (last 60 days, visible in-app)
  const entries = useMemo(() => getInAppEntries(60), []);
  const groupedEntries = useMemo(() => groupByDate(entries), [entries]);

  // Mark as viewed when drawer opens
  useEffect(() => {
    if (isOpen) {
      markAsViewed();
    }
  }, [isOpen]);

  return (
    <Transition show={isOpen} className="fixed inset-0 z-50">
      {/* Overlay */}
      <Transition.Child
        enter="transition-opacity ease-out duration-150"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity ease-in duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      </Transition.Child>

      {/* Drawer */}
      <Transition.Child
        enter="transform transition ease-out duration-200"
        enterFrom="translate-x-full"
        enterTo="translate-x-0"
        leave="transform transition ease-in duration-150"
        leaveFrom="translate-x-0"
        leaveTo="translate-x-full"
      >
        <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                What's New
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Recent updates and improvements
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Close"
            >
              <XIcon />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {entries.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  No recent updates
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Check back soon for new features and improvements.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {groupedEntries.map(group => (
                  <div key={group.date} className="p-4">
                    {/* Date Header */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        {formatRelativeDate(group.date)}
                      </span>
                      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                    </div>
                    
                    {/* Entries for this date */}
                    <div className="space-y-1">
                      {group.entries.map(entry => (
                        <ChangeLogEntry
                          key={entry.id}
                          entry={entry}
                          compact
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <a
              href="/changelog"
              className="block w-full text-center px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              View full change log
            </a>
          </div>
        </div>
      </Transition.Child>
    </Transition>
  );
};

export default WhatsNewDrawer;

