import React, { useState, useEffect, useCallback } from 'react';

export interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface GuidedTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  onStepChange?: (stepIndex: number) => void;
}

const GuidedTour: React.FC<GuidedTourProps> = ({ steps, isOpen, onClose, onComplete, onStepChange }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Find and highlight the target element
  const updateTargetPosition = useCallback(() => {
    if (!step) return;

    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);

      // Scroll element into view if needed
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setTargetRect(null);
    }
  }, [step]);

  useEffect(() => {
    if (isOpen) {
      updateTargetPosition();
      window.addEventListener('resize', updateTargetPosition);
      window.addEventListener('scroll', updateTargetPosition);

      return () => {
        window.removeEventListener('resize', updateTargetPosition);
        window.removeEventListener('scroll', updateTargetPosition);
      };
    }
  }, [isOpen, currentStep, updateTargetPosition]);

  // Reset when tour opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      onStepChange?.(0);
    }
  }, [isOpen, onStepChange]);

  // Notify parent of step changes
  useEffect(() => {
    if (isOpen) {
      onStepChange?.(currentStep);
    }
  }, [currentStep, isOpen, onStepChange]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen || !step) return null;

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) {
      // Center on screen if no target found
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 16;
    const tooltipWidth = 360;
    const tooltipHeight = 200; // Approximate
    const placement = step.placement || 'bottom';

    let top: number;
    let left: number;

    switch (placement) {
      case 'top':
        top = targetRect.top - tooltipHeight - padding;
        left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
        break;
      case 'bottom':
        top = targetRect.bottom + padding;
        left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
        break;
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
        left = targetRect.left - tooltipWidth - padding;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
        left = targetRect.right + padding;
        break;
      default:
        top = targetRect.bottom + padding;
        left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
    }

    // Keep tooltip on screen
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
    };
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[9998]">
        {/* Dark overlay with spotlight cutout */}
        <svg className="w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left - 12}
                  y={targetRect.top - 12}
                  width={targetRect.width + 24}
                  height={targetRect.height + 24}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.7)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Highlight border around target */}
        {targetRect && (
          <div
            className="absolute border-2 border-blue-500 rounded-lg pointer-events-none animate-pulse"
            style={{
              top: targetRect.top - 12,
              left: targetRect.left - 12,
              width: targetRect.width + 24,
              height: targetRect.height + 24,
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <div
        className="z-[9999] bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden"
        style={getTooltipStyle()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
              {currentStep + 1}
            </span>
            <span className="text-sm text-blue-100">of {steps.length}</span>
          </div>
          <button
            onClick={handleSkip}
            className="text-blue-100 hover:text-white text-sm"
          >
            Skip tour
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {step.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            {step.content}
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={isFirstStep}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${isFirstStep
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
          >
            ← Previous
          </button>
          <button
            onClick={handleNext}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isLastStep ? 'Finish Tour' : 'Next →'}
          </button>
        </div>

        {/* Progress dots */}
        <div className="px-5 pb-4 flex justify-center gap-1.5">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-2 h-2 rounded-full transition-colors ${index === currentStep
                ? 'bg-blue-600'
                : index < currentStep
                  ? 'bg-blue-300'
                  : 'bg-gray-300 dark:bg-gray-600'
                }`}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default GuidedTour;

