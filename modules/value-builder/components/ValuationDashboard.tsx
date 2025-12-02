/**
 * Valuation Dashboard - Shows current value and historical trend
 */

import React from 'react';
import { Valuation, ValueHistoryRecord } from '../types';
import { formatCurrency, formatPercent } from '../lib/calculations';
import ValueTrendChart from './ValueTrendChart';

interface ValuationDashboardProps {
  currentValuation: Valuation | null;
  history: ValueHistoryRecord[];
  valueGrowth: { amount: number; percent: number; period: string } | null;
  onRecordValue: () => void;
  onEditCurrent: () => void;
  onCreateFirst: () => void;
}

const ValuationDashboard: React.FC<ValuationDashboardProps> = ({
  currentValuation,
  history,
  valueGrowth,
  onRecordValue,
  onEditCurrent,
  onCreateFirst,
}) => {
  // Empty state
  if (!currentValuation) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-6">
          <span className="text-4xl">💎</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">No Valuations Yet</h2>
        <p className="text-slate-400 mb-6 text-center max-w-md">
          Create your first business valuation to start tracking your company's worth over time.
        </p>
        <button
          onClick={onCreateFirst}
          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
        >
          Create Your First Valuation
        </button>
      </div>
    );
  }

  const {
    name,
    businessValue,
    adjustedEbitda,
    multiple,
    annualRevenue,
    updatedAt,
  } = currentValuation;

  const ebitdaMargin = annualRevenue > 0 ? (adjustedEbitda / annualRevenue) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Current Value Hero Card */}
      <div className="bg-gradient-to-br from-emerald-500/20 via-green-500/10 to-slate-900 border border-emerald-500/30 rounded-3xl p-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-emerald-400 text-sm uppercase tracking-wide font-medium mb-1">
                Current Business Value
              </p>
              <p className="text-xs text-slate-500">
                Based on "{name}" scenario
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onRecordValue}
                className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-lg hover:bg-emerald-500/30 transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Record to History
              </button>
              <button
                onClick={onEditCurrent}
                className="px-3 py-1.5 bg-slate-700/50 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
              >
                Edit
              </button>
            </div>
          </div>

          <div className="flex items-end gap-4 mb-6">
            <p className="text-5xl md:text-6xl font-bold text-white">
              {formatCurrency(businessValue)}
            </p>
            {valueGrowth && (
              <div className={`flex items-center gap-1 pb-2 ${
                valueGrowth.amount >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                <svg className={`w-5 h-5 ${valueGrowth.amount < 0 ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">{formatPercent(valueGrowth.percent)}</span>
                <span className="text-slate-500 text-sm">({valueGrowth.period})</span>
              </div>
            )}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Adjusted EBITDA"
              value={formatCurrency(adjustedEbitda)}
              sublabel="Annual"
            />
            <MetricCard
              label="Multiple"
              value={`${multiple.toFixed(1)}x`}
              sublabel="EBITDA"
            />
            <MetricCard
              label="EBITDA Margin"
              value={`${ebitdaMargin.toFixed(1)}%`}
              sublabel="of Revenue"
            />
            <MetricCard
              label="Annual Revenue"
              value={formatCurrency(annualRevenue, true)}
              sublabel="Top Line"
            />
          </div>
        </div>
      </div>

      {/* Value Trend Chart */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Value Over Time</h2>
          <p className="text-sm text-slate-500">
            Last updated: {new Date(updatedAt).toLocaleDateString()}
          </p>
        </div>
        
        {history.length >= 2 ? (
          <ValueTrendChart history={history} />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <p className="text-slate-400 mb-2">Not enough data for trend</p>
            <p className="text-sm text-slate-500 max-w-sm">
              Click "Record to History" to save your current value. After 2+ recordings, 
              you'll see your value trend over time.
            </p>
          </div>
        )}
      </div>

      {/* Formula Explanation */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">How It's Calculated</h2>
        <div className="flex flex-wrap items-center justify-center gap-4 text-lg">
          <div className="bg-slate-800 rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-slate-500 mb-1">EBITDA</p>
            <p className="text-emerald-400 font-semibold">{formatCurrency(adjustedEbitda)}</p>
          </div>
          <span className="text-2xl text-slate-500">×</span>
          <div className="bg-slate-800 rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-slate-500 mb-1">Multiple</p>
            <p className="text-emerald-400 font-semibold">{multiple.toFixed(1)}x</p>
          </div>
          <span className="text-2xl text-slate-500">=</span>
          <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-emerald-400 mb-1">Value</p>
            <p className="text-white font-bold">{formatCurrency(businessValue)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for metric cards
const MetricCard: React.FC<{ label: string; value: string; sublabel: string }> = ({
  label,
  value,
  sublabel,
}) => (
  <div className="bg-slate-800/50 rounded-xl p-4">
    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{label}</p>
    <p className="text-xl font-bold text-white">{value}</p>
    <p className="text-xs text-slate-500">{sublabel}</p>
  </div>
);

export default ValuationDashboard;

