import React, { useState, useRef, useEffect } from 'react';
import { PlusIcon } from '../shared/icons';
import InfoTooltip from '../help/InfoTooltip';

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
 * Follows Material Design principles for mobile-first interaction
 */
const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onAddJob,
  onAddChangeOrder,
  show = true,
  hasChangeOrderFeature = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMainHovered, setIsMainHovered] = useState(false);
  const [isMainPressed, setIsMainPressed] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      // Small delay to prevent the same click from closing the menu
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 10);
      
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isExpanded]);

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isExpanded]);

  if (!show) return null;

  const showMenu = hasChangeOrderFeature && onAddChangeOrder;

  const handleMainClick = () => {
    if (showMenu) {
      setIsExpanded(!isExpanded);
    } else {
      onAddJob();
    }
  };

  const handleAddJob = () => {
    setIsExpanded(false);
    onAddJob();
  };

  const handleAddChangeOrder = () => {
    setIsExpanded(false);
    onAddChangeOrder?.();
  };

  return (
    <div ref={menuRef} className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3">
      {/* Expanded Menu Items */}
      <div 
        className={`
          flex flex-col items-end gap-2 
          transition-all duration-200 ease-out
          ${isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
        `}
      >
        {/* Add Job Button */}
        <button
          onClick={handleAddJob}
          className="
            flex items-center gap-2 px-4 py-2.5
            bg-white dark:bg-gray-800
            text-gray-700 dark:text-gray-200
            font-medium text-sm
            rounded-full
            shadow-lg
            border border-gray-200 dark:border-gray-700
            transition-all duration-200
            hover:bg-gray-50 dark:hover:bg-gray-700
            hover:scale-105
            hover:shadow-xl
            active:scale-95
            whitespace-nowrap
          "
        >
          <span className="w-5 h-5 flex items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
            <PlusIcon className="w-3.5 h-3.5" />
          </span>
          <span>Add Job</span>
        </button>

        {/* Add Change Order Button */}
        {onAddChangeOrder && (
          <button
            onClick={handleAddChangeOrder}
            className="
              flex items-center gap-2 px-4 py-2.5
              bg-white dark:bg-gray-800
              text-gray-700 dark:text-gray-200
              font-medium text-sm
              rounded-full
              shadow-lg
              border border-gray-200 dark:border-gray-700
              transition-all duration-200
              hover:bg-gray-50 dark:hover:bg-gray-700
              hover:scale-105
              hover:shadow-xl
              active:scale-95
              whitespace-nowrap
            "
          >
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <ChangeOrderIcon className="w-3.5 h-3.5" />
            </span>
            <span>Add Change Order</span>
          </button>
        )}
      </div>

      {/* Main FAB Button with Tooltip */}
      <div className="flex items-center gap-2">
        {/* Tooltip - only show when not expanded */}
        {!isExpanded && (
          <InfoTooltip
            shortText={showMenu ? "Quick actions for adding jobs and change orders." : "Add a new job to your portfolio."}
            detailedText={showMenu 
              ? "Click to expand the menu and choose between adding a new job or adding a change order to an existing job. Change orders allow you to track scope modifications, price adjustments, and contract amendments."
              : "Opens the job creation form where you can enter all details for a new project including contract value, budget, dates, and team assignments."
            }
            title={showMenu ? "Quick Actions" : "Add Job"}
            size="sm"
          />
        )}
        
        <button
          onClick={handleMainClick}
          onMouseEnter={() => setIsMainHovered(true)}
          onMouseLeave={() => {
            setIsMainHovered(false);
            setIsMainPressed(false);
          }}
          onMouseDown={() => setIsMainPressed(true)}
          onMouseUp={() => setIsMainPressed(false)}
          className={`
            flex items-center gap-2
            px-4 py-3
            bg-gradient-to-r from-orange-500 to-amber-500
            text-white font-semibold
            rounded-full
            shadow-lg shadow-orange-500/30
            transition-all duration-300 ease-out
            hover:shadow-xl hover:shadow-orange-500/40
            hover:scale-105
            focus:outline-none focus:ring-4 focus:ring-orange-500/30
            ${isMainPressed ? 'scale-95' : ''}
            group
          `}
          aria-label={isExpanded ? "Close menu" : (showMenu ? "Open quick actions menu" : "Add Job")}
          aria-expanded={showMenu ? isExpanded : undefined}
          data-tour="add-job-button"
        >
          {/* Icon with rotation animation */}
          <span className={`transition-transform duration-300 ${isExpanded ? 'rotate-45' : ''}`}>
            <PlusIcon />
          </span>
          
          {/* Label - always visible on desktop, hidden on mobile */}
          <span className="hidden sm:inline pr-1">
            {showMenu ? (isExpanded ? 'Close' : 'Add') : 'Add Job'}
          </span>
          
          {/* Ripple effect on click */}
          {isMainPressed && (
            <span className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
          )}
        </button>
      </div>
    </div>
  );
};

export default FloatingActionButton;
