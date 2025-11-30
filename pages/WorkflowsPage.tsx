import React, { useState } from 'react';
import { workflows, Workflow, WorkflowStep } from '../lib/workflows';

interface WorkflowsPageProps {
  onBack: () => void;
}

const frequencyLabels: Record<Workflow['frequency'], string> = {
  'one-time': 'One-time setup',
  'as-needed': 'As needed',
  'weekly': 'Weekly',
  'monthly': 'Monthly',
};

const frequencyColors: Record<Workflow['frequency'], string> = {
  'one-time': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'as-needed': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'weekly': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'monthly': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
};

const WorkflowCard: React.FC<{ workflow: Workflow; isExpanded: boolean; onToggle: () => void }> = ({
  workflow,
  isExpanded,
  onToggle,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-5 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
      >
        <span className="text-3xl">{workflow.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {workflow.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
            {workflow.description}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${frequencyColors[workflow.frequency]}`}>
            {frequencyLabels[workflow.frequency]}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
            ~{workflow.estimatedMinutes} min
          </span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-100 dark:border-gray-700">
          {/* When to use */}
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <span className="font-semibold">When to do this:</span> {workflow.when}
            </p>
          </div>

          {/* Steps */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">
              Steps
            </h4>
            <div className="space-y-4">
              {workflow.steps.map((step, index) => (
                <StepCard key={index} step={step} stepNumber={index + 1} />
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
              Pro Tips
            </h4>
            <ul className="space-y-2">
              {workflow.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="text-amber-500 mt-0.5">💡</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

const StepCard: React.FC<{ step: WorkflowStep; stepNumber: number }> = ({ step, stepNumber }) => {
  return (
    <div className="flex gap-4">
      {/* Step number */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm">
        {stepNumber}
      </div>
      
      {/* Step content */}
      <div className="flex-1 min-w-0">
        <h5 className="font-medium text-gray-900 dark:text-white">
          {step.title}
        </h5>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {step.description}
        </p>
        
        {/* Step tips */}
        {step.tips && step.tips.length > 0 && (
          <ul className="mt-2 space-y-1">
            {step.tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-500">
                <span className="text-gray-400">→</span>
                {tip}
              </li>
            ))}
          </ul>
        )}
        
        {/* Action button */}
        {step.action && (
          <button className="mt-2 inline-flex items-center gap-1 text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium">
            {step.action}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

const WorkflowsPage: React.FC<WorkflowsPageProps> = ({ onBack }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterFrequency, setFilterFrequency] = useState<Workflow['frequency'] | 'all'>('all');

  const filteredWorkflows = filterFrequency === 'all' 
    ? workflows 
    : workflows.filter(w => w.frequency === filterFrequency);

  const toggleWorkflow = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold">Workflows & Guides</h1>
                <p className="text-orange-100 text-sm mt-1">Step-by-step instructions for common tasks</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg">
              <span className="text-2xl">📚</span>
              <span className="text-sm font-medium">{workflows.length} guides</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilterFrequency('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterFrequency === 'all'
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            All Workflows
          </button>
          {(['one-time', 'as-needed', 'weekly', 'monthly'] as const).map(freq => (
            <button
              key={freq}
              onClick={() => setFilterFrequency(freq)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterFrequency === freq
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {frequencyLabels[freq]}
            </button>
          ))}
        </div>

        {/* Quick Start Card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 mb-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl">
              🚀
            </div>
            <div>
              <h2 className="text-lg font-semibold">Quick Start Guide</h2>
              <p className="text-slate-300 text-sm mt-1">
                New to WIP Insights? Start with <strong>Setting Up a New Company</strong>, then <strong>Creating a New Job</strong>. 
                After that, follow the weekly <strong>Updating Job Financials</strong> workflow.
              </p>
            </div>
          </div>
        </div>

        {/* Workflow Cards */}
        <div className="space-y-4">
          {filteredWorkflows.map(workflow => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              isExpanded={expandedId === workflow.id}
              onToggle={() => toggleWorkflow(workflow.id)}
            />
          ))}
        </div>

        {filteredWorkflows.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No workflows match the selected filter.
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowsPage;

