/**
 * Interview Conductor Component
 * 
 * Step-by-step questionnaire UI for conducting interviews.
 * Displays one question at a time with navigation and progress tracking.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  InterviewSession, 
  InterviewTemplate, 
  InterviewQuestion, 
  InterviewResponse,
  InterviewProgress,
  ROLE_DISPLAY_NAMES,
  ROLE_ICONS 
} from '../types';
import { getTemplateByRole } from '../templates';
import { QuestionInput } from './QuestionInputs';

interface InterviewConductorProps {
  session: InterviewSession;
  onSaveResponse: (response: InterviewResponse) => Promise<boolean>;
  onUpdateSession: (data: Partial<InterviewSession>) => Promise<boolean>;
  onComplete: () => void;
  onExit: () => void;
}

export const InterviewConductor: React.FC<InterviewConductorProps> = ({
  session,
  onSaveResponse,
  onUpdateSession,
  onComplete,
  onExit,
}) => {
  const template = getTemplateByRole(session.role);
  
  // Current position in the interview
  const [sectionIndex, setSectionIndex] = useState(session.currentSectionIndex || 0);
  const [questionIndex, setQuestionIndex] = useState(session.currentQuestionIndex || 0);
  
  // Current answer and notes
  const [currentAnswer, setCurrentAnswer] = useState<string | number | boolean | string[] | undefined>(undefined);
  const [currentNotes, setCurrentNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  
  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  
  // Start time tracking
  const [startTime] = useState(Date.now());

  // Get current section and question
  const currentSection = template.sections[sectionIndex];
  const currentQuestion = currentSection?.questions[questionIndex];
  
  // Flatten all questions for progress tracking
  const allQuestions = useMemo(() => {
    return template.sections.flatMap((section, sIdx) => 
      section.questions.map((q, qIdx) => ({
        question: q,
        sectionIndex: sIdx,
        questionIndex: qIdx,
        globalIndex: template.sections.slice(0, sIdx).reduce((acc, s) => acc + s.questions.length, 0) + qIdx,
      }))
    );
  }, [template]);

  const totalQuestions = allQuestions.length;
  const currentGlobalIndex = template.sections.slice(0, sectionIndex).reduce((acc, s) => acc + s.questions.length, 0) + questionIndex;

  // Find existing response for current question
  useEffect(() => {
    if (currentQuestion) {
      const existingResponse = session.responses.find(r => r.questionId === currentQuestion.id);
      if (existingResponse) {
        setCurrentAnswer(existingResponse.value);
        setCurrentNotes(existingResponse.notes || '');
      } else {
        setCurrentAnswer(undefined);
        setCurrentNotes('');
      }
    }
  }, [currentQuestion, session.responses]);

  // Calculate progress
  const progress: InterviewProgress = useMemo(() => {
    const answered = session.responses.filter(r => !r.skipped).length;
    const skipped = session.responses.filter(r => r.skipped).length;
    const answeredMinutes = Math.floor((Date.now() - startTime) / 60000);
    const avgTimePerQuestion = answered > 0 ? answeredMinutes / answered : 2;
    const remaining = totalQuestions - answered - skipped;
    
    return {
      totalQuestions,
      answeredQuestions: answered,
      skippedQuestions: skipped,
      percentComplete: Math.round(((answered + skipped) / totalQuestions) * 100),
      currentSection: currentSection?.title || '',
      estimatedTimeRemaining: Math.round(remaining * avgTimePerQuestion),
    };
  }, [session.responses, totalQuestions, currentSection, startTime]);

  // Save current response
  const saveCurrentResponse = useCallback(async (skipped = false) => {
    if (!currentQuestion) return true;
    
    setIsSaving(true);
    
    const response: InterviewResponse = {
      questionId: currentQuestion.id,
      sectionId: currentSection.id,
      value: skipped ? '' : (currentAnswer ?? ''),
      notes: currentNotes || undefined,
      skipped,
      timestamp: new Date().toISOString(),
    };

    const success = await onSaveResponse(response);
    setIsSaving(false);
    return success;
  }, [currentQuestion, currentSection, currentAnswer, currentNotes, onSaveResponse]);

  // Navigate to next question
  const goNext = async () => {
    // Save current answer first
    if (currentAnswer !== undefined || currentNotes) {
      await saveCurrentResponse();
    }

    // Check if we're at the last question of the last section
    if (sectionIndex === template.sections.length - 1 && 
        questionIndex === currentSection.questions.length - 1) {
      // Interview complete
      await onUpdateSession({
        status: 'completed',
        conductedDate: new Date().toISOString(),
        duration: Math.round((Date.now() - startTime) / 60000),
      });
      onComplete();
      return;
    }

    // Move to next question
    if (questionIndex < currentSection.questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      await onUpdateSession({
        currentSectionIndex: sectionIndex,
        currentQuestionIndex: questionIndex + 1,
      });
    } else {
      // Move to next section
      setSectionIndex(sectionIndex + 1);
      setQuestionIndex(0);
      await onUpdateSession({
        currentSectionIndex: sectionIndex + 1,
        currentQuestionIndex: 0,
      });
    }
  };

  // Navigate to previous question
  const goPrevious = async () => {
    // Save current answer first
    if (currentAnswer !== undefined || currentNotes) {
      await saveCurrentResponse();
    }

    if (questionIndex > 0) {
      setQuestionIndex(questionIndex - 1);
      await onUpdateSession({
        currentSectionIndex: sectionIndex,
        currentQuestionIndex: questionIndex - 1,
      });
    } else if (sectionIndex > 0) {
      const prevSection = template.sections[sectionIndex - 1];
      setSectionIndex(sectionIndex - 1);
      setQuestionIndex(prevSection.questions.length - 1);
      await onUpdateSession({
        currentSectionIndex: sectionIndex - 1,
        currentQuestionIndex: prevSection.questions.length - 1,
      });
    }
  };

  // Skip current question
  const skipQuestion = async () => {
    await saveCurrentResponse(true);
    await goNext();
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && currentQuestion?.type !== 'textarea') {
        e.preventDefault();
        goNext();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, currentQuestion]);

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No questions available</p>
      </div>
    );
  }

  const isFirstQuestion = sectionIndex === 0 && questionIndex === 0;
  const isLastQuestion = sectionIndex === template.sections.length - 1 && 
                         questionIndex === currentSection.questions.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onExit}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{ROLE_ICONS[session.role]}</span>
                  <h1 className="text-lg font-semibold">{ROLE_DISPLAY_NAMES[session.role]} Interview</h1>
                </div>
                {session.intervieweeName && (
                  <p className="text-sm text-slate-400">with {session.intervieweeName}</p>
                )}
              </div>
            </div>
            
            {/* Progress */}
            <div className="text-right">
              <p className="text-sm text-slate-400">
                Question {currentGlobalIndex + 1} of {totalQuestions}
              </p>
              <p className="text-xs text-slate-500">
                ~{progress.estimatedTimeRemaining} min remaining
              </p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300"
              style={{ width: `${progress.percentComplete}%` }}
            />
          </div>
        </div>
      </div>

      {/* Section indicator */}
      <div className="max-w-4xl mx-auto px-6 pt-6">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-2xl">{currentSection.icon}</span>
          <span className="text-orange-400 font-medium">{currentSection.title}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">{currentSection.description}</span>
        </div>
      </div>

      {/* Question */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-8">
          {/* Question text */}
          <div className="mb-8">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-sm font-bold">
                {questionIndex + 1}
              </span>
              <div>
                <h2 className="text-xl font-medium text-white leading-relaxed">
                  {currentQuestion.text}
                  {currentQuestion.required && <span className="text-red-400 ml-1">*</span>}
                </h2>
                {currentQuestion.helpText && (
                  <p className="mt-2 text-sm text-slate-400">{currentQuestion.helpText}</p>
                )}
              </div>
            </div>
          </div>

          {/* Answer input */}
          <div className="mb-6">
            <QuestionInput
              question={currentQuestion}
              value={currentAnswer}
              onChange={setCurrentAnswer}
            />
          </div>

          {/* Follow-up prompt */}
          {currentQuestion.followUp && currentAnswer && (
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-sm text-blue-300">
                <span className="font-medium">Follow-up:</span> {currentQuestion.followUp}
              </p>
            </div>
          )}

          {/* Notes toggle */}
          <div className="border-t border-slate-700 pt-6">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <svg className={`w-4 h-4 transition-transform ${showNotes ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>Interviewer Notes</span>
              {currentNotes && <span className="text-orange-400">•</span>}
            </button>
            
            {showNotes && (
              <textarea
                value={currentNotes}
                onChange={(e) => setCurrentNotes(e.target.value)}
                placeholder="Add observations, context, or follow-up notes..."
                rows={3}
                className="mt-3 w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none text-sm"
              />
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-800/95 border-t border-slate-700 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={goPrevious}
              disabled={isFirstQuestion || isSaving}
              className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            <div className="flex items-center gap-3">
              {!currentQuestion.required && (
                <button
                  onClick={skipQuestion}
                  disabled={isSaving}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Skip
                </button>
              )}
              
              <button
                onClick={goNext}
                disabled={isSaving || (currentQuestion.required && currentAnswer === undefined)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSaving ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : isLastQuestion ? (
                  <>
                    Complete Interview
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                ) : (
                  <>
                    Next
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section navigation dots */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 space-y-2">
        {template.sections.map((section, idx) => (
          <button
            key={section.id}
            onClick={() => {
              setSectionIndex(idx);
              setQuestionIndex(0);
            }}
            className={`block w-3 h-3 rounded-full transition-all ${
              idx === sectionIndex
                ? 'bg-orange-500 scale-125'
                : idx < sectionIndex
                ? 'bg-green-500'
                : 'bg-slate-600 hover:bg-slate-500'
            }`}
            title={section.title}
          />
        ))}
      </div>
    </div>
  );
};

export default InterviewConductor;

