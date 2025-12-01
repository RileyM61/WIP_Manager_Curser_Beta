/**
 * Question Input Components
 * 
 * Specialized input components for each question type
 * in the interview conductor.
 */

import React from 'react';
import { InterviewQuestion } from '../types';

interface QuestionInputProps {
  question: InterviewQuestion;
  value: string | number | boolean | string[] | undefined;
  onChange: (value: string | number | boolean | string[]) => void;
  disabled?: boolean;
}

// ============================================================================
// TEXT INPUT
// ============================================================================
export const TextInput: React.FC<QuestionInputProps> = ({ question, value, onChange, disabled }) => (
  <input
    type="text"
    value={(value as string) || ''}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    placeholder="Enter your answer..."
    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
  />
);

// ============================================================================
// TEXTAREA INPUT
// ============================================================================
export const TextareaInput: React.FC<QuestionInputProps> = ({ question, value, onChange, disabled }) => (
  <textarea
    value={(value as string) || ''}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    placeholder="Enter your detailed response..."
    rows={4}
    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
  />
);

// ============================================================================
// SCALE INPUT (1-10 slider)
// ============================================================================
export const ScaleInput: React.FC<QuestionInputProps> = ({ question, value, onChange, disabled }) => {
  const min = question.scaleMin || 1;
  const max = question.scaleMax || 10;
  const currentValue = (value as number) || Math.floor((min + max) / 2);
  
  const getScaleColor = (val: number) => {
    const percentage = ((val - min) / (max - min)) * 100;
    if (percentage <= 33) return 'from-red-500 to-orange-500';
    if (percentage <= 66) return 'from-orange-500 to-yellow-500';
    return 'from-yellow-500 to-green-500';
  };

  return (
    <div className="space-y-4">
      {/* Scale labels */}
      {question.scaleLabels && (
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>{question.scaleLabels.low}</span>
          {question.scaleLabels.mid && <span>{question.scaleLabels.mid}</span>}
          <span>{question.scaleLabels.high}</span>
        </div>
      )}
      
      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={currentValue}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
        />
        
        {/* Value display */}
        <div className="flex justify-center mt-3">
          <div className={`px-6 py-2 rounded-full bg-gradient-to-r ${getScaleColor(currentValue)} text-white font-bold text-xl shadow-lg`}>
            {currentValue}
          </div>
        </div>
      </div>
      
      {/* Scale numbers */}
      <div className="flex justify-between text-xs text-gray-400">
        {Array.from({ length: max - min + 1 }, (_, i) => min + i).map(num => (
          <span key={num} className={num === currentValue ? 'text-orange-500 font-bold' : ''}>{num}</span>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// MULTIPLE CHOICE INPUT
// ============================================================================
export const MultipleChoiceInput: React.FC<QuestionInputProps> = ({ question, value, onChange, disabled }) => {
  const options = question.options || [];
  const selectedValue = value as string;

  return (
    <div className="space-y-3">
      {options.map((option, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onChange(option)}
          disabled={disabled}
          className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
            selectedValue === option
              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
              : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-orange-300 dark:hover:border-orange-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              selectedValue === option
                ? 'border-orange-500 bg-orange-500'
                : 'border-gray-300 dark:border-gray-500'
            }`}>
              {selectedValue === option && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className="text-sm">{option}</span>
          </div>
        </button>
      ))}
    </div>
  );
};

// ============================================================================
// YES/NO INPUT
// ============================================================================
export const YesNoInput: React.FC<QuestionInputProps> = ({ question, value, onChange, disabled }) => {
  const selectedValue = value as boolean | undefined;

  return (
    <div className="flex gap-4">
      <button
        type="button"
        onClick={() => onChange(true)}
        disabled={disabled}
        className={`flex-1 py-4 px-6 rounded-xl border-2 font-semibold transition-all ${
          selectedValue === true
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
            : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-green-300'
        } disabled:opacity-50`}
      >
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl">✓</span>
          <span>Yes</span>
        </div>
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        disabled={disabled}
        className={`flex-1 py-4 px-6 rounded-xl border-2 font-semibold transition-all ${
          selectedValue === false
            ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
            : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-red-300'
        } disabled:opacity-50`}
      >
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl">✗</span>
          <span>No</span>
        </div>
      </button>
    </div>
  );
};

// ============================================================================
// CURRENCY INPUT
// ============================================================================
export const CurrencyInput: React.FC<QuestionInputProps> = ({ question, value, onChange, disabled }) => {
  const numValue = value as number | undefined;
  
  const formatForDisplay = (val: number | undefined): string => {
    if (val === undefined || val === 0) return '';
    return val.toLocaleString();
  };

  const parseInput = (input: string): number => {
    const cleaned = input.replace(/[^0-9.-]/g, '');
    return parseFloat(cleaned) || 0;
  };

  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-semibold">$</span>
      <input
        type="text"
        value={formatForDisplay(numValue)}
        onChange={(e) => onChange(parseInput(e.target.value))}
        disabled={disabled}
        placeholder="0"
        className="w-full pl-8 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-right text-lg font-mono"
      />
    </div>
  );
};

// ============================================================================
// PERCENTAGE INPUT
// ============================================================================
export const PercentageInput: React.FC<QuestionInputProps> = ({ question, value, onChange, disabled }) => {
  const numValue = value as number | undefined;

  return (
    <div className="relative max-w-xs">
      <input
        type="number"
        value={numValue ?? ''}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        disabled={disabled}
        placeholder="0"
        min={0}
        max={100}
        step={1}
        className="w-full pr-10 pl-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-lg font-mono"
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-semibold">%</span>
    </div>
  );
};

// ============================================================================
// NUMBER INPUT
// ============================================================================
export const NumberInput: React.FC<QuestionInputProps> = ({ question, value, onChange, disabled }) => {
  const numValue = value as number | undefined;

  return (
    <div className="max-w-xs">
      <input
        type="number"
        value={numValue ?? ''}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        disabled={disabled}
        placeholder="0"
        min={0}
        step={1}
        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-lg font-mono"
      />
    </div>
  );
};

// ============================================================================
// QUESTION INPUT DISPATCHER
// ============================================================================
export const QuestionInput: React.FC<QuestionInputProps> = (props) => {
  switch (props.question.type) {
    case 'text':
      return <TextInput {...props} />;
    case 'textarea':
      return <TextareaInput {...props} />;
    case 'scale':
      return <ScaleInput {...props} />;
    case 'multiple-choice':
      return <MultipleChoiceInput {...props} />;
    case 'yes-no':
      return <YesNoInput {...props} />;
    case 'currency':
      return <CurrencyInput {...props} />;
    case 'percentage':
      return <PercentageInput {...props} />;
    case 'number':
      return <NumberInput {...props} />;
    default:
      return <TextInput {...props} />;
  }
};

export default QuestionInput;

