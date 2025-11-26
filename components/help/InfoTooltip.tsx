import React, { useState, useRef, useEffect } from 'react';

interface InfoTooltipProps {
  /** Short text shown on hover (1-2 sentences) */
  shortText: string;
  /** Detailed explanation shown in slide panel on click */
  detailedText: string;
  /** Optional title for the detail panel */
  title?: string;
  /** Optional example to show in detail panel */
  example?: string;
  /** Optional formula to display */
  formula?: string;
  /** Size of the icon */
  size?: 'sm' | 'md';
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({
  shortText,
  detailedText,
  title,
  example,
  formula,
  size = 'sm',
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showPanel && tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setShowPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPanel]);

  // Close panel on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showPanel) {
        setShowPanel(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showPanel]);

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div ref={tooltipRef} className="relative inline-flex items-center">
      {/* Info Icon Button */}
      <button
        type="button"
        className={`${iconSize} rounded-full bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1`}
        onMouseEnter={() => setShowPopup(true)}
        onMouseLeave={() => setShowPopup(false)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowPanel(!showPanel);
          setShowPopup(false);
        }}
        aria-label="More information"
      >
        i
      </button>

      {/* Hover Popup - Quick explanation */}
      {showPopup && !showPanel && (
        <div
          ref={popupRef}
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg"
          role="tooltip"
        >
          <p>{shortText}</p>
          <p className="mt-1 text-gray-400 text-[10px]">Click for more details</p>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900 dark:border-t-gray-700" />
        </div>
      )}

      {/* Click Panel - Detailed explanation */}
      {showPanel && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowPanel(false)} />
          
          {/* Slide Panel */}
          <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto animate-slide-in-right">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-lg font-bold">?</span>
                </div>
                <h3 className="text-lg font-semibold">{title || 'Help'}</h3>
              </div>
              <button
                onClick={() => setShowPanel(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5">
              {/* Main explanation */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Explanation
                </h4>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {detailedText}
                </p>
              </div>

              {/* Formula */}
              {formula && (
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-2">
                    Formula
                  </h4>
                  <code className="text-blue-800 dark:text-blue-200 font-mono text-sm">
                    {formula}
                  </code>
                </div>
              )}

              {/* Example */}
              {example && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-2">
                    Example
                  </h4>
                  <p className="text-amber-800 dark:text-amber-200 text-sm whitespace-pre-line">
                    {example}
                  </p>
                </div>
              )}

              {/* Pro tip */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">💡 Tip:</span> Hover over any (i) icon for a quick explanation, or click it to see detailed help like this.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default InfoTooltip;

