import React, { useState } from 'react';
import { PlusIcon } from '../shared/icons';

// Change Order icon
const ChangeOrderIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

interface FloatingActionButtonProps {
  onAddJob: () => void;
  onAddChangeOrder?: () => void;
  show?: boolean;
  hasChangeOrderFeature?: boolean;
}

/**
 * Floating Action Button (FAB) with expandable menu
 */
const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onAddJob,
  onAddChangeOrder,
  show = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!show) return null;

  const hasMenu = !!onAddChangeOrder;

  const handleMainClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (hasMenu) {
      setIsExpanded(!isExpanded);
    } else {
      onAddJob();
    }
  };

  const handleAddJob = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(false);
    onAddJob();
  };

  const handleAddChangeOrder = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(false);
    onAddChangeOrder?.();
  };

  // Close when clicking outside
  const handleBackdropClick = () => {
    setIsExpanded(false);
  };

  return (
    <>
      {/* Backdrop to close menu */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={handleBackdropClick}
        />
      )}
      
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Expanded Menu */}
        {isExpanded && hasMenu && (
          <div className="flex flex-col items-end gap-2 mb-2">
            {/* Add Job Option */}
            <button
              onClick={handleAddJob}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium text-sm rounded-full shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
            >
              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-wip-card dark:bg-wip-gold/30 text-wip-gold-dark dark:text-wip-gold">
                <PlusIcon className="w-3.5 h-3.5" />
              </span>
              <span>Add Job</span>
            </button>

            {/* Add Change Order Option */}
            <button
              onClick={handleAddChangeOrder}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium text-sm rounded-full shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
            >
              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-wip-card dark:bg-wip-gold/30 text-wip-gold-dark dark:text-wip-gold">
                <ChangeOrderIcon className="w-3.5 h-3.5" />
              </span>
              <span>Add Change Order</span>
            </button>
          </div>
        )}

        {/* Main FAB Button */}
        <button
          type="button"
          onClick={handleMainClick}
          className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-wip-gold to-wip-gold-dark text-white font-semibold rounded-full shadow-lg shadow-wip-gold/30 hover:shadow-xl hover:shadow-wip-gold/40 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-wip-gold/30 active:scale-95 transition-all cursor-pointer"
          style={{ pointerEvents: 'auto' }}
          data-tour="add-job-button"
          title={hasMenu ? "Quick actions: Add Job or Change Order" : "Add a new job"}
        >
          <span className={`transition-transform duration-300 ${isExpanded ? 'rotate-45' : ''}`}>
            <PlusIcon />
          </span>
          <span className="hidden sm:inline">
            {isExpanded ? 'Close' : (hasMenu ? 'Add' : 'Add Job')}
          </span>
        </button>
      </div>
    </>
  );
};

export default FloatingActionButton;
