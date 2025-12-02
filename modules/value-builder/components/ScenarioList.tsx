/**
 * Scenario List - Grid of saved valuation scenarios
 */

import React from 'react';
import { Valuation } from '../types';
import { formatCurrency } from '../lib/calculations';

interface ScenarioListProps {
  valuations: Valuation[];
  compareIds: string[];
  onEdit: (valuation: Valuation) => void;
  onDelete: (valuation: Valuation) => void;
  onDuplicate: (valuation: Valuation) => void;
  onSetCurrent: (id: string) => Promise<boolean>;
  onToggleCompare: (id: string) => void;
  onViewCompare: () => void;
}

const ScenarioList: React.FC<ScenarioListProps> = ({
  valuations,
  compareIds,
  onEdit,
  onDelete,
  onDuplicate,
  onSetCurrent,
  onToggleCompare,
  onViewCompare,
}) => {
  if (valuations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
          <span className="text-3xl">📋</span>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">No Scenarios Yet</h2>
        <p className="text-slate-400 text-center max-w-md">
          Create multiple valuation scenarios to compare different assumptions
          and plan for various outcomes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Compare Action Bar */}
      {compareIds.length > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 font-medium">
              {compareIds.length} scenario{compareIds.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => compareIds.forEach(id => onToggleCompare(id))}
              className="text-sm text-slate-400 hover:text-white"
            >
              Clear
            </button>
          </div>
          <button
            onClick={onViewCompare}
            disabled={compareIds.length < 2}
            className="px-4 py-2 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Compare Selected
          </button>
        </div>
      )}

      {/* Scenarios Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {valuations.map(valuation => {
          const isSelected = compareIds.includes(valuation.id);
          const ebitdaMargin = valuation.annualRevenue > 0 
            ? (valuation.adjustedEbitda / valuation.annualRevenue) * 100 
            : 0;

          return (
            <div
              key={valuation.id}
              className={`relative bg-slate-900/50 border rounded-2xl p-5 transition-all ${
                valuation.isCurrent
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : isSelected
                  ? 'border-blue-500/50 bg-blue-500/5'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Current Badge */}
              {valuation.isCurrent && (
                <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-emerald-500 text-white text-xs font-semibold rounded-full">
                  Current
                </div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white truncate">
                    {valuation.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Updated {new Date(valuation.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                
                {/* Compare checkbox */}
                <button
                  onClick={() => onToggleCompare(valuation.id)}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                >
                  {isSelected && (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Value */}
              <div className="mb-4">
                <p className="text-3xl font-bold text-white">
                  {formatCurrency(valuation.businessValue)}
                </p>
                <p className="text-sm text-slate-500">Business Value</p>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                  <p className="text-sm font-semibold text-emerald-400">
                    {formatCurrency(valuation.adjustedEbitda, true)}
                  </p>
                  <p className="text-xs text-slate-500">EBITDA</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                  <p className="text-sm font-semibold text-emerald-400">
                    {valuation.multiple.toFixed(1)}x
                  </p>
                  <p className="text-xs text-slate-500">Multiple</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                  <p className="text-sm font-semibold text-emerald-400">
                    {ebitdaMargin.toFixed(0)}%
                  </p>
                  <p className="text-xs text-slate-500">Margin</p>
                </div>
              </div>

              {/* Notes Preview */}
              {valuation.notes && (
                <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                  {valuation.notes}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit(valuation)}
                  className="flex-1 px-3 py-2 bg-slate-800 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDuplicate(valuation)}
                  className="px-3 py-2 bg-slate-800 text-slate-300 text-sm rounded-lg hover:bg-slate-700 transition-colors"
                  title="Duplicate"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                {!valuation.isCurrent && (
                  <>
                    <button
                      onClick={() => onSetCurrent(valuation.id)}
                      className="px-3 py-2 bg-emerald-500/20 text-emerald-400 text-sm rounded-lg hover:bg-emerald-500/30 transition-colors"
                      title="Set as Current"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(valuation)}
                      className="px-3 py-2 bg-red-500/20 text-red-400 text-sm rounded-lg hover:bg-red-500/30 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScenarioList;

