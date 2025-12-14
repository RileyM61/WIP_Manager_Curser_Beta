/**
 * CFO Chat Floating Action Button
 * 
 * A floating button to open the Coach Martin chat drawer.
 */

import React from 'react';
import { COACH_MARTIN } from '../../types/ai';

interface CFOChatFABProps {
  onClick: () => void;
  hasUnread?: boolean;
  disabled?: boolean;
}

const CFOChatFAB: React.FC<CFOChatFABProps> = ({
  onClick,
  hasUnread = false,
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="fixed bottom-6 right-6 z-40 group"
      aria-label="Open Coach Martin chat"
    >
      {/* Button */}
      <div className="relative">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group-hover:scale-105 group-disabled:opacity-50 group-disabled:cursor-not-allowed overflow-hidden border-2 border-white dark:border-gray-800">
          <img
            src={COACH_MARTIN.avatarUrl}
            alt={COACH_MARTIN.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-white text-lg font-bold">CM</span>';
            }}
          />
        </div>

        {/* Unread indicator */}
        {hasUnread && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></span>
        )}

        {/* Online indicator */}
        <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Ask {COACH_MARTIN.name}
        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
      </div>
    </button>
  );
};

export default CFOChatFAB;
