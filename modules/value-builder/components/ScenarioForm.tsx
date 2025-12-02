/**
 * Scenario Form - Create/Edit valuation modal
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Valuation, ValuationFormData } from '../types';
import { DEFAULT_VALUATION, ADDBACK_CATEGORIES, getMultipleDescription, getSuggestedMultiple, MULTIPLE_CONFIG } from '../constants';
import { calculateValuation, formatCurrency, formatNumber } from '../lib/calculations';

interface ScenarioFormProps {
  valuation: Valuation | null;
  onSubmit: (data: ValuationFormData) => void;
  onClose: () => void;
}

const ScenarioForm: React.FC<ScenarioFormProps> = ({
  valuation,
  onSubmit,
  onClose,
}) => {
  const [formData, setFormData] = useState<ValuationFormData>(() => {
    if (valuation) {
      return {
        name: valuation.name,
        annualRevenue: valuation.annualRevenue,
        netProfit: valuation.netProfit,
        ownerCompensation: valuation.ownerCompensation,
        depreciation: valuation.depreciation,
        interestExpense: valuation.interestExpense,
        taxes: valuation.taxes,
        otherAddbacks: valuation.otherAddbacks,
        multiple: valuation.multiple,
        notes: valuation.notes || '',
        isCurrent: valuation.isCurrent,
      };
    }
    return { ...DEFAULT_VALUATION, isCurrent: true };
  });

  // Calculate results in real-time
  const results = useMemo(() => calculateValuation(formData), [formData]);

  // Get suggested multiple based on revenue
  const suggestedMultiple = useMemo(
    () => getSuggestedMultiple(formData.annualRevenue),
    [formData.annualRevenue]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a scenario name');
      return;
    }
    onSubmit(formData);
  };

  const handleChange = (field: keyof ValuationFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-white">
            {valuation ? 'Edit Scenario' : 'New Valuation Scenario'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Left Column - Inputs */}
              <div className="space-y-6">
                {/* Scenario Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Scenario Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g., Q4 2024 Baseline, Growth Scenario"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                {/* Revenue & Profit */}
                <div className="bg-slate-800/50 rounded-xl p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                    Revenue & Profit
                  </h3>
                  <CurrencyInput
                    label="Annual Revenue"
                    value={formData.annualRevenue}
                    onChange={(v) => handleChange('annualRevenue', v)}
                    tooltip="Your total annual sales/revenue"
                  />
                  <CurrencyInput
                    label="Net Profit (After Tax)"
                    value={formData.netProfit}
                    onChange={(v) => handleChange('netProfit', v)}
                    tooltip="Bottom line profit from your P&L"
                  />
                </div>

                {/* EBITDA Add-backs */}
                <div className="bg-slate-800/50 rounded-xl p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                    EBITDA Add-backs
                  </h3>
                  {ADDBACK_CATEGORIES.map(({ key, label, tooltip }) => (
                    <CurrencyInput
                      key={key}
                      label={label}
                      value={formData[key as keyof ValuationFormData] as number}
                      onChange={(v) => handleChange(key as keyof ValuationFormData, v)}
                      tooltip={tooltip}
                    />
                  ))}
                </div>

                {/* Multiple Slider */}
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                      Valuation Multiple
                    </h3>
                    <span className="text-2xl font-bold text-emerald-400">
                      {formData.multiple.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min={MULTIPLE_CONFIG.min}
                    max={MULTIPLE_CONFIG.max}
                    step={MULTIPLE_CONFIG.step}
                    value={formData.multiple}
                    onChange={(e) => handleChange('multiple', parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>{MULTIPLE_CONFIG.min}x</span>
                    <span>{MULTIPLE_CONFIG.max}x</span>
                  </div>
                  <p className="text-sm text-emerald-400 mt-3 text-center">
                    {getMultipleDescription(formData.multiple)}
                  </p>
                  
                  {/* Suggested Range */}
                  {formData.annualRevenue > 0 && (
                    <div className="mt-3 p-2 bg-slate-700/50 rounded-lg">
                      <p className="text-xs text-slate-400 text-center">
                        Suggested range for {suggestedMultiple.label}:{' '}
                        <span className="text-emerald-400 font-medium">
                          {suggestedMultiple.low}x - {suggestedMultiple.high}x
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="Add assumptions, context, or reminders..."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                  />
                </div>

                {/* Set as Current */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isCurrent}
                    onChange={(e) => handleChange('isCurrent', e.target.checked)}
                    className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
                  />
                  <span className="text-slate-300">Set as current valuation</span>
                </label>
              </div>

              {/* Right Column - Live Results */}
              <div className="lg:sticky lg:top-0 h-fit space-y-6">
                {/* Main Value */}
                <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center">
                  <p className="text-emerald-400 text-sm uppercase tracking-wide mb-2">
                    Estimated Business Value
                  </p>
                  <p className="text-4xl md:text-5xl font-bold text-white mb-2">
                    {formatCurrency(results.businessValue)}
                  </p>
                  {formData.annualRevenue > 0 && (
                    <p className="text-slate-400 text-sm">
                      {results.valueToRevenue.toFixed(0)}% of annual revenue
                    </p>
                  )}
                </div>

                {/* Calculation Breakdown */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">
                    Calculation
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1.5 border-b border-slate-700">
                      <span className="text-slate-400">Net Profit</span>
                      <span className="text-white">{formatCurrency(formData.netProfit)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-700">
                      <span className="text-slate-400">+ Owner Comp</span>
                      <span className="text-white">{formatCurrency(formData.ownerCompensation)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-700">
                      <span className="text-slate-400">+ Depreciation</span>
                      <span className="text-white">{formatCurrency(formData.depreciation)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-700">
                      <span className="text-slate-400">+ Interest</span>
                      <span className="text-white">{formatCurrency(formData.interestExpense)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-700">
                      <span className="text-slate-400">+ Taxes</span>
                      <span className="text-white">{formatCurrency(formData.taxes)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-700">
                      <span className="text-slate-400">+ Other Add-backs</span>
                      <span className="text-white">{formatCurrency(formData.otherAddbacks)}</span>
                    </div>
                    <div className="flex justify-between py-2 bg-emerald-500/10 rounded-lg px-2 -mx-2">
                      <span className="text-emerald-400 font-semibold">Adjusted EBITDA</span>
                      <span className="text-emerald-400 font-semibold">{formatCurrency(results.adjustedEbitda)}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-400">× Multiple</span>
                      <span className="text-white">{formData.multiple.toFixed(1)}x</span>
                    </div>
                  </div>
                </div>

                {/* EBITDA Margin */}
                {formData.annualRevenue > 0 && (
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">EBITDA Margin</span>
                      <span className="text-lg font-semibold text-emerald-400">
                        {results.ebitdaMargin.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, results.ebitdaMargin)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-800 flex justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 text-slate-300 font-medium rounded-xl hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
            >
              {valuation ? 'Update Scenario' : 'Create Scenario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Currency Input Component
const CurrencyInput: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  tooltip?: string;
}> = ({ label, value, onChange, tooltip }) => {
  const [displayValue, setDisplayValue] = useState(value ? formatNumber(value) : '');

  useEffect(() => {
    if (value) {
      setDisplayValue(formatNumber(value));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.-]/g, '');
    setDisplayValue(raw);
    const num = parseFloat(raw) || 0;
    onChange(num);
  };

  const handleBlur = () => {
    if (value) {
      setDisplayValue(formatNumber(value));
    }
  };

  const handleFocus = () => {
    if (value) {
      setDisplayValue(value.toString());
    }
  };

  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-1">
        {label}
        {tooltip && (
          <span className="group relative cursor-help">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              {tooltip}
            </span>
          </span>
        )}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder="0"
          className="w-full pl-7 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
        />
      </div>
    </div>
  );
};

export default ScenarioForm;

