/**
 * CFO Chat Drawer Component
 * 
 * Main chat interface for Coach Martin AI CFO assistant.
 */

import React, { useRef, useEffect } from 'react';
import { Transition } from '@headlessui/react';
import { XIcon } from '../shared/icons';
import { COACH_MARTIN, ChatMessage, SuggestedQuestion } from '../../types/ai';
import CFOMessage from './CFOMessage';
import CFOInput from './CFOInput';
import CFOSuggestedQuestions from './CFOSuggestedQuestions';

interface CFOChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  suggestedQuestions: SuggestedQuestion[];
  onSourceClick?: (sourceId: string) => void;
  usageInfo?: {
    questionsRemaining: number;
    resetsAt: string;
  };
  error?: string | null;
}

const CFOChatDrawer: React.FC<CFOChatDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  isLoading,
  onSendMessage,
  suggestedQuestions,
  onSourceClick,
  usageInfo,
  error,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const showWelcome = messages.length === 0;

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
        <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={COACH_MARTIN.avatarUrl}
                  alt={COACH_MARTIN.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-amber-300 dark:border-amber-600"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f59e0b" width="100" height="100"/><text x="50" y="60" text-anchor="middle" fill="white" font-size="40">CM</text></svg>';
                  }}
                />
                <div>
                  <div className="font-bold text-gray-900 dark:text-white">{COACH_MARTIN.name}</div>
                  <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    {COACH_MARTIN.title} • {COACH_MARTIN.tagline}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Close chat"
              >
                <XIcon />
              </button>
            </div>
            
            {/* Usage info */}
            {usageInfo && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {usageInfo.questionsRemaining} questions remaining • Resets {new Date(usageInfo.resetsAt).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              ⚠️ {COACH_MARTIN.disclaimer}
            </p>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {showWelcome ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <img
                  src={COACH_MARTIN.avatarUrl}
                  alt={COACH_MARTIN.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-amber-200 dark:border-amber-700 mb-4"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f59e0b" width="100" height="100"/><text x="50" y="60" text-anchor="middle" fill="white" font-size="40">CM</text></svg>';
                  }}
                />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Hey, I'm {COACH_MARTIN.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  I've been a CFO in construction for 30 years. Ask me anything about WIP, 
                  job costing, billing, or what those numbers on your dashboard actually mean.
                </p>
                
                <CFOSuggestedQuestions
                  questions={suggestedQuestions}
                  onSelect={onSendMessage}
                />
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <CFOMessage
                    key={msg.id}
                    message={msg}
                    onSourceClick={onSourceClick}
                  />
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <img
                        src={COACH_MARTIN.avatarUrl}
                        alt={COACH_MARTIN.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-amber-200 dark:border-amber-700"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f59e0b" width="100" height="100"/><text x="50" y="60" text-anchor="middle" fill="white" font-size="40">CM</text></svg>';
                        }}
                      />
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/30 rounded-2xl rounded-tl-md px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Suggested follow-ups (when not in welcome state) */}
          {!showWelcome && messages.length > 0 && suggestedQuestions.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <CFOSuggestedQuestions
                questions={suggestedQuestions.slice(0, 3)}
                onSelect={onSendMessage}
                compact
              />
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CFOInput
              onSend={onSendMessage}
              disabled={isLoading}
            />
          </div>
        </div>
      </Transition.Child>
    </Transition>
  );
};

export default CFOChatDrawer;
