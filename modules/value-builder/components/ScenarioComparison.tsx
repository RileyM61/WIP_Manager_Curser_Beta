/**
 * Scenario Comparison - Side-by-side analysis of multiple valuations
 */

import React from 'react';
import { Valuation } from '../types';
import { formatCurrency, compareScenarios } from '../lib/calculations';

interface ScenarioComparisonProps {
  valuations: Valuation[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onClearSelection: () => void;
}

const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({
  valuations,
  selectedIds,
  onToggleSelect,
  onClearSelection,
}) => {
  // Get selected valuations in order
  const selectedValuations = selectedIds
    .map(id => valuations.find(v => v.id === id))
    .filter((v): v is Valuation => v !== undefined);

  // Generate comparison data
  const comparisonData = compareScenarios(selectedValuations);

  // Empty state - not enough selected
  if (selectedIds.length < 2) {
    return (
      <div className="space-y-6">
        {/* Selection prompt */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚖️</span>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Select Scenarios to Compare
          </h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Choose 2-3 scenarios from the list below to see a side-by-side comparison.
          </p>
        </div>

        {/* Available scenarios */}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {valuations.map(valuation => {
            const isSelected = selectedIds.includes(valuation.id);
            return (
              <button
                key={valuation.id}
                onClick={() => onToggleSelect(valuation.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/50'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-white truncate">{valuation.name}</h3>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <p className="text-2xl font-bold text-emerald-400">
                  {formatCurrency(valuation.businessValue)}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Comparison view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          Comparing {selectedValuations.length} Scenarios
        </h2>
        <button
          onClick={onClearSelection}
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          Clear Selection
        </button>
      </div>

      {/* Value Comparison Cards */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedValuations.length}, 1fr)` }}>
        {selectedValuations.map((valuation, idx) => (
          <div
            key={valuation.id}
            className={`bg-gradient-to-br rounded-2xl p-6 text-center ${
              idx === 0
                ? 'from-emerald-500/20 to-green-500/10 border border-emerald-500/30'
                : idx === 1
                ? 'from-blue-500/20 to-indigo-500/10 border border-blue-500/30'
                : 'from-purple-500/20 to-pink-500/10 border border-purple-500/30'
            }`}
          >
            <button
              onClick={() => onToggleSelect(valuation.id)}
              className="absolute top-2 right-2 text-slate-400 hover:text-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <p className="text-sm text-slate-400 mb-1 truncate">{valuation.name}</p>
            <p className="text-3xl font-bold text-white">
              {formatCurrency(valuation.businessValue)}
            </p>
            {valuation.isCurrent && (
              <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                Current
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Detailed Comparison Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left p-4 text-sm font-medium text-slate-400">Metric</th>
                {selectedValuations.map((v, idx) => (
                  <th key={v.id} className="text-right p-4 text-sm font-medium text-slate-400">
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                      idx === 0 ? 'bg-emerald-500' : idx === 1 ? 'bg-blue-500' : 'bg-purple-500'
                    }`} />
                    {v.name}
                  </th>
                ))}
                {selectedValuations.length === 2 && (
                  <th className="text-right p-4 text-sm font-medium text-slate-400">Difference</th>
                )}
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, rowIdx) => {
                const isHighlight = row.field === 'adjustedEbitda' || row.field === 'businessValue';
                const isCurrency = row.field !== 'multiple';
                
                return (
                  <tr
                    key={row.field}
                    className={`border-b border-slate-800/50 ${
                      isHighlight ? 'bg-emerald-500/5' : ''
                    }`}
                  >
                    <td className={`p-4 text-sm ${isHighlight ? 'text-emerald-400 font-medium' : 'text-slate-300'}`}>
                      {row.label}
                    </td>
                    {row.values.map((value, idx) => {
                      const isMax = value === row.max && row.delta > 0;
                      const isMin = value === row.min && row.delta > 0;
                      
                      return (
                        <td
                          key={idx}
                          className={`p-4 text-sm text-right font-mono ${
                            isHighlight ? 'text-white font-semibold' : 'text-slate-300'
                          } ${isMax ? 'text-emerald-400' : ''} ${isMin && !isMax ? 'text-slate-500' : ''}`}
                        >
                          {isCurrency ? formatCurrency(value) : `${value.toFixed(1)}x`}
                          {isMax && row.delta > 0 && (
                            <span className="ml-1 text-xs text-emerald-500">↑</span>
                          )}
                        </td>
                      );
                    })}
                    {selectedValuations.length === 2 && (
                      <td className={`p-4 text-sm text-right font-mono ${
                        row.delta > 0
                          ? row.values[0] > row.values[1] ? 'text-emerald-400' : 'text-red-400'
                          : 'text-slate-500'
                      }`}>
                        {row.delta > 0 ? (
                          <>
                            {row.values[0] >= row.values[1] ? '+' : '-'}
                            {isCurrency ? formatCurrency(Math.abs(row.delta)) : `${Math.abs(row.delta).toFixed(1)}x`}
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Key Insights */}
      {selectedValuations.length === 2 && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">
            Key Differences
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Value Difference */}
            <InsightCard
              label="Value Difference"
              value={formatCurrency(Math.abs(selectedValuations[0].businessValue - selectedValuations[1].businessValue))}
              subtext={`${((selectedValuations[0].businessValue / selectedValuations[1].businessValue - 1) * 100).toFixed(0)}% ${
                selectedValuations[0].businessValue > selectedValuations[1].businessValue ? 'higher' : 'lower'
              }`}
              highlight={true}
            />
            {/* EBITDA Difference */}
            <InsightCard
              label="EBITDA Difference"
              value={formatCurrency(Math.abs(selectedValuations[0].adjustedEbitda - selectedValuations[1].adjustedEbitda))}
              subtext={`${((selectedValuations[0].adjustedEbitda / selectedValuations[1].adjustedEbitda - 1) * 100).toFixed(0)}% difference`}
            />
            {/* Multiple Difference */}
            <InsightCard
              label="Multiple Difference"
              value={`${Math.abs(selectedValuations[0].multiple - selectedValuations[1].multiple).toFixed(1)}x`}
              subtext={`${selectedValuations[0].multiple.toFixed(1)}x vs ${selectedValuations[1].multiple.toFixed(1)}x`}
            />
          </div>
        </div>
      )}

      {/* Add more scenarios */}
      {selectedIds.length < 3 && (
        <div className="text-center py-4">
          <p className="text-slate-500 text-sm">
            Click a scenario from the Scenarios tab to add it to this comparison (max 3)
          </p>
        </div>
      )}
    </div>
  );
};

// Insight Card Component
const InsightCard: React.FC<{
  label: string;
  value: string;
  subtext: string;
  highlight?: boolean;
}> = ({ label, value, subtext, highlight }) => (
  <div className={`rounded-xl p-4 ${
    highlight ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-slate-800/50'
  }`}>
    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{label}</p>
    <p className={`text-xl font-bold ${highlight ? 'text-emerald-400' : 'text-white'}`}>
      {value}
    </p>
    <p className="text-sm text-slate-400">{subtext}</p>
  </div>
);

export default ScenarioComparison;

