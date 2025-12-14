/**
 * CFO Suggested Questions Component
 * 
 * Displays contextual suggested questions to help users get started.
 */

import React from 'react';
import { SuggestedQuestion } from '../../types/ai';

interface CFOSuggestedQuestionsProps {
  questions: SuggestedQuestion[];
  onSelect: (question: string) => void;
  compact?: boolean;
}

const CFOSuggestedQuestions: React.FC<CFOSuggestedQuestionsProps> = ({
  questions,
  onSelect,
  compact = false,
}) => {
  if (questions.length === 0) return null;

  const categoryIcons: Record<SuggestedQuestion['category'], string> = {
    general: '📚',
    'job-specific': '🔍',
    'weekly-review': '📅',
    troubleshooting: '🔧',
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {questions.slice(0, 3).map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(q.text)}
            className="text-xs px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
          >
            {q.text}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        Suggested Questions
      </p>
      <div className="grid gap-2">
        {questions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(q.text)}
            className="text-left px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-amber-400 dark:hover:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors group"
          >
            <div className="flex items-start gap-2">
              <span className="text-base">{categoryIcons[q.category]}</span>
              <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-amber-700 dark:group-hover:text-amber-300">
                {q.text}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CFOSuggestedQuestions;
