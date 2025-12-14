/**
 * CFO Message Component
 * 
 * Renders a single chat message from either the user or Coach Martin.
 */

import React from 'react';
import { ChatMessage, COACH_MARTIN, KnowledgeSource } from '../../types/ai';

interface CFOMessageProps {
  message: ChatMessage;
  onSourceClick?: (sourceId: string) => void;
}

const CFOMessage: React.FC<CFOMessageProps> = ({ message, onSourceClick }) => {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`flex gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`}>
      {/* Avatar */}
      {isAssistant ? (
        <div className="flex-shrink-0">
          <img
            src={COACH_MARTIN.avatarUrl}
            alt={COACH_MARTIN.name}
            className="w-10 h-10 rounded-full object-cover border-2 border-amber-200 dark:border-amber-700"
            onError={(e) => {
              // Fallback if image not found
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f59e0b" width="100" height="100"/><text x="50" y="60" text-anchor="middle" fill="white" font-size="40">CM</text></svg>';
            }}
          />
        </div>
      ) : (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
          <span className="text-white text-sm font-medium">You</span>
        </div>
      )}

      {/* Message Content */}
      <div className={`flex-1 max-w-[80%] ${isAssistant ? '' : 'text-right'}`}>
        {/* Name and timestamp */}
        <div className={`flex items-center gap-2 mb-1 ${isAssistant ? '' : 'justify-end'}`}>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {isAssistant ? COACH_MARTIN.name : 'You'}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Message bubble */}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isAssistant
              ? 'bg-amber-50 dark:bg-amber-900/30 text-gray-800 dark:text-gray-200 rounded-tl-md'
              : 'bg-blue-500 text-white rounded-tr-md'
          }`}
        >
          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        </div>

        {/* Sources */}
        {isAssistant && message.sources && message.sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Sources:</span>
            {message.sources.map((source) => (
              <button
                key={source.id}
                onClick={() => onSourceClick?.(source.id)}
                className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
              >
                {source.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CFOMessage;
