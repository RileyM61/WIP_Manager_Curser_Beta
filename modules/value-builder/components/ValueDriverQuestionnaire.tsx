/**
 * Value Driver Questionnaire Component
 * Guides users through assessment questions and shows results
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Question,
  QuestionnaireAnswers,
  ValueDriverScore,
  calculateValueDriverScores,
  calculateAdjustedMultipleRange,
  getCategoryName,
  getQuestionsByCategory,
  getAllCategories,
  ValueDriverCategory,
  calculateOverallScore,
  identifyStrengthsAndWeaknesses,
} from '../lib/questionnaire';
import { getSuggestedMultiple } from '../constants';
import { getActionItemsForCategory, estimateCostForCategory, calculateROI } from '../lib/strategicActions';
import { StrategicRecommendation } from '../types';

interface ValueDriverQuestionnaireProps {
  annualRevenue: number;
  currentMultiple: number;
  onComplete: (answers: QuestionnaireAnswers, adjustedRange: ReturnType<typeof calculateAdjustedMultipleRange>) => void;
  onCancel?: () => void;
  previousAnswers?: QuestionnaireAnswers; // Optional: load previous answers
}

const ValueDriverQuestionnaire: React.FC<ValueDriverQuestionnaireProps> = ({
  annualRevenue,
  currentMultiple,
  onComplete,
  onCancel,
  previousAnswers,
}) => {
  const hasPreviousAnswers = previousAnswers && Object.keys(previousAnswers).length > 0;

  const [answers, setAnswers] = useState<QuestionnaireAnswers>(previousAnswers || {});
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Try-catch wrapper for safety
  let categories: ValueDriverCategory[];
  try {
    categories = getAllCategories();
  } catch (error) {
    console.error('Error getting categories:', error);
    return (
      <div className="bg-slate-900 rounded-2xl p-8 max-w-4xl mx-auto">
        <div className="text-center text-red-400">
          <p>Error loading questionnaire: {error instanceof Error ? error.message : 'Unknown error'}</p>
          <p className="text-xs text-slate-500 mt-2">Check browser console for details</p>
        </div>
      </div>
    );
  }

  // Safety check: ensure we have categories
  if (!categories || categories.length === 0) {
    return (
      <div className="bg-slate-900 rounded-2xl p-8 max-w-4xl mx-auto">
        <div className="text-center text-red-400">
          <p>Error: No categories found. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  let currentCategory: ValueDriverCategory;
  let categoryQuestions: Question[];

  try {
    currentCategory = categories[currentCategoryIndex];
    if (!currentCategory) {
      throw new Error(`Invalid category index: ${currentCategoryIndex}`);
    }
    categoryQuestions = getQuestionsByCategory(currentCategory);
  } catch (error) {
    console.error('Error loading category/questions:', error);
    return (
      <div className="bg-slate-900 rounded-2xl p-8 max-w-4xl mx-auto">
        <div className="text-center text-red-400">
          <p>Error loading questions: {error instanceof Error ? error.message : 'Unknown error'}</p>
          <p className="text-xs text-slate-500 mt-2">Check browser console for details</p>
        </div>
      </div>
    );
  }

  // Safety check: ensure we have questions for this category
  if (!categoryQuestions || categoryQuestions.length === 0) {
    return (
      <div className="bg-slate-900 rounded-2xl p-8 max-w-4xl mx-auto">
        <div className="text-center text-red-400">
          <p>Error: No questions found for category "{currentCategory}". Please refresh the page.</p>
        </div>
      </div>
    );
  }

  const allQuestionsAnswered = useMemo(() => {
    return categoryQuestions.every(q => answers[q.id] !== undefined);
  }, [categoryQuestions, answers]);

  // Scroll to top when category changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentCategoryIndex, showResults]);

  const handleAnswer = (questionId: string, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentCategoryIndex < categories.length - 1) {
      setCurrentCategoryIndex(prev => prev + 1);
      // Scroll to top when moving to next category
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } else {
      // All categories complete, show results
      setShowResults(true);
      // Scroll to top when showing results
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const handlePrevious = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(prev => prev - 1);
      // Scroll to top when going back to previous category
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const handleFinish = () => {
    const baseRange = getSuggestedMultiple(annualRevenue);
    const adjustedRange = calculateAdjustedMultipleRange(baseRange, answers);
    onComplete(answers, adjustedRange);
  };

  const scores = useMemo(() => calculateValueDriverScores(answers), [answers]);
  const baseRange = getSuggestedMultiple(annualRevenue);
  const adjustedRange = useMemo(
    () => calculateAdjustedMultipleRange(baseRange, answers),
    [baseRange, answers]
  );

  const overallScore = useMemo(() => calculateOverallScore(answers), [answers]);
  const { strengths, weaknesses } = useMemo(() => identifyStrengthsAndWeaknesses(scores), [scores]);

  // Generate strategic recommendations
  const recommendations = useMemo((): StrategicRecommendation[] => {
    return scores
      .sort((a, b) => a.score - b.score) // Sort by lowest scores first (highest priority)
      .slice(0, 5)
      .map(score => {
        const targetScore = Math.min(2, score.score + 1); // Aim to improve by 1 point
        const potentialImpact = (targetScore - score.score) * score.weight * 0.5;
        const actionItems = getActionItemsForCategory(score.category, score.score);
        const estimatedCost = estimateCostForCategory(score.category);
        const roi = calculateROI(potentialImpact, estimatedCost);

        return {
          category: score.category,
          priority: score.score < -0.5 ? 'high' : score.score < 0 ? 'medium' : 'low',
          currentScore: score.score,
          targetScore,
          potentialValueImpact: potentialImpact,
          actionItems,
          estimatedCost,
          estimatedTimeline: '3-12 months', // This could be more sophisticated
          roi,
        };
      });
  }, [scores]);

  const progress = useMemo(() => {
    return categories.length > 0 ? ((currentCategoryIndex + 1) / categories.length) * 100 : 0;
  }, [currentCategoryIndex, categories.length]);

  if (showResults) {
    return (
      <div
        ref={scrollContainerRef}
        className="bg-slate-900 rounded-2xl p-8 max-w-5xl mx-auto max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-2xl font-bold text-white mb-6">Value Driver Analysis Results</h2>

        {/* Overall Score */}
        <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/10 border border-emerald-500/30 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-emerald-400">Overall Value Driver Score</h3>
            <span className={`text-3xl font-bold ${overallScore > 0.5 ? 'text-emerald-400' :
                overallScore > -0.5 ? 'text-yellow-400' :
                  'text-red-400'
              }`}>
              {overallScore > 0 ? '+' : ''}{overallScore.toFixed(2)}
            </span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${overallScore > 0 ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              style={{ width: `${((overallScore + 2) / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Adjusted Multiple Range */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Adjusted Multiple Range</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-sm text-slate-400 mb-1">Low</p>
              <p className="text-2xl font-bold text-white">{adjustedRange.low.toFixed(1)}x</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-400 mb-1">Mid (Recommended)</p>
              <p className="text-3xl font-bold text-emerald-400">{adjustedRange.mid.toFixed(1)}x</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-400 mb-1">High</p>
              <p className="text-2xl font-bold text-white">{adjustedRange.high.toFixed(1)}x</p>
            </div>
          </div>
          {adjustedRange.adjustment !== 0 && (
            <div className="text-center">
              <p className="text-sm text-slate-400">
                {adjustedRange.adjustment > 0 ? '+' : ''}{adjustedRange.adjustment.toFixed(1)}x adjustment from base range
                <span className="text-emerald-400 ml-2">
                  ({baseRange.low.toFixed(1)}x - {baseRange.high.toFixed(1)}x)
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Strengths and Weaknesses */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-emerald-400 mb-3">Top Strengths</h4>
            <ul className="space-y-2">
              {strengths.map(cat => (
                <li key={cat} className="text-sm text-white">
                  ✓ {getCategoryName(cat)}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-red-400 mb-3">Areas for Improvement</h4>
            <ul className="space-y-2">
              {weaknesses.map(cat => (
                <li key={cat} className="text-sm text-white">
                  • {getCategoryName(cat)}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Value Driver Scores */}
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Value Driver Scores</h3>
          {scores.map(score => (
            <div key={score.category} className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 font-medium">{getCategoryName(score.category)}</span>
                <span className={`font-semibold ${score.impact > 0.1 ? 'text-emerald-400' :
                    score.impact < -0.1 ? 'text-red-400' :
                      'text-slate-400'
                  }`}>
                  {score.impact > 0 ? '+' : ''}{score.impact.toFixed(2)}x
                </span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${score.score > 0 ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                  style={{ width: `${Math.abs(score.score) * 25}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Strategic Investment Opportunities */}
        <div className="bg-slate-800/50 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">
            Strategic Investment Opportunities
          </h3>
          <p className="text-slate-400 text-sm mb-4">
            Based on your assessment, here are the highest-impact improvements you could make:
          </p>
          <div className="space-y-3">
            {recommendations.slice(0, 3).map((rec, idx) => (
              <div key={idx} className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{getCategoryName(rec.category)}</span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${rec.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                      rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                    }`}>
                    {rec.priority.toUpperCase()} PRIORITY
                  </span>
                </div>
                <p className="text-sm text-slate-300 mb-2">
                  Potential value increase: <span className="text-emerald-400 font-semibold">
                    +{rec.potentialValueImpact.toFixed(2)}x multiple
                  </span>
                </p>
                {rec.actionItems.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-slate-400 mb-1">Recommended actions:</p>
                    <ul className="text-xs text-slate-300 space-y-1">
                      {rec.actionItems.map((action, i) => (
                        <li key={i}>• {action}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {rec.roi && rec.roi > 0 && (
                  <p className="text-xs text-emerald-400 mt-2">
                    Estimated ROI: {(rec.roi * 100).toFixed(0)}%
                  </p>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-4">
            💡 These insights will be available in the Strategic Planning module to help prioritize investments
          </p>
        </div>

        <div className="flex justify-end gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-5 py-2.5 bg-slate-800 text-slate-300 font-medium rounded-xl hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleFinish}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
          >
            Apply to Valuation
          </button>
        </div>
      </div>
    );
  }

  // Ensure we have valid data before rendering
  if (!currentCategory || !categoryQuestions) {
    return (
      <div className="bg-slate-900 rounded-2xl p-8 max-w-4xl mx-auto">
        <div className="text-center text-red-400">
          <p>Error: Invalid category data. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      className="bg-slate-900 rounded-2xl p-8 max-w-4xl mx-auto max-h-[90vh] overflow-y-auto"
    >
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">
            Category {currentCategoryIndex + 1} of {categories.length}
          </span>
          <span className="text-sm text-slate-400">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Category Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          {getCategoryName(currentCategory)}
        </h2>
        <p className="text-slate-400">
          Answer the following questions to assess your company's strengths and weaknesses
        </p>
        {hasPreviousAnswers && (
          <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <p className="text-sm text-emerald-400">
              📝 Previous answers loaded. You can modify any answers as needed.
            </p>
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-6 mb-6">
        {categoryQuestions.map(question => {
          const selectedValue = answers[question.id];
          return (
            <div key={question.id} className="bg-slate-800/50 rounded-lg p-5">
              <div className="flex items-start gap-2 mb-4">
                <h3 className="text-lg font-medium text-white flex-1">{question.question}</h3>
                {question.tooltip && (
                  <span className="group relative cursor-help flex-shrink-0">
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-slate-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 max-w-xs">
                      {question.tooltip}
                    </span>
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {question.options.map(option => (
                  <label
                    key={option.value}
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${selectedValue === option.value
                        ? 'bg-emerald-500/20 border-2 border-emerald-500'
                        : 'bg-slate-700/50 border-2 border-transparent hover:border-slate-600'
                      }`}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={option.value}
                      checked={selectedValue === option.value}
                      onChange={() => handleAnswer(question.id, option.value)}
                      className="mt-1 w-4 h-4 text-emerald-500 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <span className="text-white font-medium">{option.label}</span>
                      {option.description && (
                        <p className="text-sm text-slate-400 mt-1">{option.description}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentCategoryIndex === 0}
          className="px-5 py-2.5 bg-slate-800 text-slate-300 font-medium rounded-xl hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={!allQuestionsAnswered}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {currentCategoryIndex === categories.length - 1 ? 'View Results' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default ValueDriverQuestionnaire;

