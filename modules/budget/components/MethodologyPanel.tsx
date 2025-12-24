import React, { useEffect, useMemo, useState } from 'react';
import { ForecastLineItem, StatementType } from '../types';
import { METHOD_OPTIONS, FORECAST_METHOD_DEFINITIONS, MethodParameter } from '../lib/forecastMethodologies';
import type { useForecastMethodologies } from '../hooks/useForecastMethodologies';
import type { useForecastEngine } from '../hooks/useForecastEngine';
import { ForecastPoint } from '../lib/forecastCalculations';

interface MethodologyPanelProps {
  companyId: string | null;
  lineItems: ForecastLineItem[];
  onForecastRun?: () => void;
  methodHook: ReturnType<typeof useForecastMethodologies>;
  engineHook: ReturnType<typeof useForecastEngine>;
}

interface DraftConfig {
  methodology: string;
  parameters: Record<string, any>;
}

const STATEMENT_TABS: { id: StatementType; label: string; description: string }[] = [
  { id: 'income_statement', label: 'Income Statement', description: 'Revenue, COGS, SG&A' },
  { id: 'balance_sheet', label: 'Balance Sheet', description: 'Assets, liabilities, equity' },
];

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) return '$0';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

const ParameterInput: React.FC<{
  parameter: MethodParameter;
  value: any;
  onChange: (nextValue: any) => void;
}> = ({ parameter, value, onChange }) => {
  const commonProps = {
    id: parameter.key,
    name: parameter.key,
    className: 'w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-wip-gold',
  };

  switch (parameter.type) {
    case 'number':
    case 'percent':
      return (
        <div>
          <label className="text-xs font-semibold text-slate-500">{parameter.label}</label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="number"
              {...commonProps}
              value={value ?? parameter.defaultValue}
              min={parameter.min}
              max={parameter.max}
              step={parameter.step ?? (parameter.type === 'percent' ? 0.1 : 1)}
              onChange={(event) => onChange(event.target.value === '' ? '' : Number(event.target.value))}
            />
            {parameter.type === 'percent' && <span className="text-xs text-slate-500 font-semibold">%</span>}
          </div>
          {parameter.helperText && <p className="text-xs text-slate-400 mt-1">{parameter.helperText}</p>}
        </div>
      );
    case 'select':
      return (
        <div>
          <label className="text-xs font-semibold text-slate-500">{parameter.label}</label>
          <select
            {...commonProps}
            value={value ?? parameter.defaultValue}
            onChange={(event) => onChange(event.target.value)}
          >
            {parameter.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {parameter.helperText && <p className="text-xs text-slate-400 mt-1">{parameter.helperText}</p>}
        </div>
      );
    case 'text':
    default:
      return (
        <div>
          <label className="text-xs font-semibold text-slate-500">{parameter.label}</label>
          <input
            type="text"
            {...commonProps}
            value={value ?? parameter.defaultValue ?? ''}
            onChange={(event) => onChange(event.target.value)}
          />
          {parameter.helperText && <p className="text-xs text-slate-400 mt-1">{parameter.helperText}</p>}
        </div>
      );
  }
};

const MethodologyPanel: React.FC<MethodologyPanelProps> = ({ companyId, lineItems, onForecastRun, methodHook, engineHook }) => {
  const [activeStatement, setActiveStatement] = useState<StatementType>('income_statement');
  const [drafts, setDrafts] = useState<Record<string, DraftConfig>>({});
  const [previews, setPreviews] = useState<Record<string, ForecastPoint[]>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const { configs, getConfigForLine, saveMethodology, loading: methodsLoading } = methodHook;
  const { runForecast, running, getSeriesForLine } = engineHook;

  // Initialize drafts when line items or configs change
  useEffect(() => {
    setDrafts((prev) => {
      const next = { ...prev };
      lineItems.forEach((line) => {
        const config = getConfigForLine(line.id);
        if (!next[line.id]) {
          next[line.id] = {
            methodology: config.methodology,
            parameters: { ...config.parameters },
          };
        }
      });
      return next;
    });
  }, [lineItems, configs, getConfigForLine]);

  const statementLineItems = useMemo(
    () => lineItems.filter((line) => line.statementType === activeStatement),
    [lineItems, activeStatement]
  );

  const handleDraftChange = (lineId: string, updater: (draft: DraftConfig) => DraftConfig) => {
    setDrafts((prev) => ({
      ...prev,
      [lineId]: updater(prev[lineId] || { methodology: 'run_rate', parameters: {} }),
    }));
  };

  const handleSave = async (lineId: string) => {
    const draft = drafts[lineId];
    if (!draft) return;
    try {
      await saveMethodology(lineId, draft.methodology as any, draft.parameters);
      setToastType('success');
      setToast('Methodology saved.');
      setTimeout(() => setToast(null), 2500);
    } catch (err: any) {
      setToastType('error');
      setToast(err.message || 'Failed to save methodology');
    }
  };

  const handlePreview = async (line: ForecastLineItem) => {
    const draft = drafts[line.id];
    if (!draft) return;
    try {
      const configMap = {
        [line.id]: {
          id: configs[line.id]?.id ?? `preview-${line.id}`,
          companyId: companyId ?? '',
          lineItemId: line.id,
          methodology: draft.methodology,
          parameters: draft.parameters,
          isActive: true,
          createdAt: configs[line.id]?.createdAt ?? new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
      const forecasts = await runForecast({
        lineItems: [line],
        configs: configMap as any,
        months: 12,
        persist: false,
      });
      setPreviews((prev) => ({
        ...prev,
        [line.id]: forecasts[line.id],
      }));
    } catch (err: any) {
      setToastType('error');
      setToast(err.message || 'Preview failed');
    }
  };

  const handleRunAll = async () => {
    const configsMap = lineItems.reduce<Record<string, any>>((acc, line) => {
      const draft = drafts[line.id] || { methodology: 'run_rate', parameters: {} };
      acc[line.id] = {
        id: configs[line.id]?.id ?? `run-${line.id}`,
        companyId: companyId ?? '',
        lineItemId: line.id,
        methodology: draft.methodology,
        parameters: draft.parameters,
        isActive: true,
        createdAt: configs[line.id]?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return acc;
    }, {});

    try {
      await runForecast({
        lineItems,
        configs: configsMap,
        months: 12,
        persist: true,
      });
      setToastType('success');
      setToast('Forecast regenerated for all lines.');
      onForecastRun?.();
      setTimeout(() => setToast(null), 2500);
    } catch (err: any) {
      setToastType('error');
      setToast(err.message || 'Forecast run failed');
    }
  };

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-semibold text-orange-600 uppercase tracking-[0.2em] mb-2">Forecast Engine</p>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Assign Methodologies per Line</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-3xl mt-2">
            Select the forecasting approach for each account. Configure parameters like lookback, growth rates, or drivers, then regenerate the 12-month forecast in one click.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRunAll}
          disabled={!companyId || running || methodsLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white font-semibold px-5 py-3 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {running ? 'Running Forecast...' : 'Run 12-Month Forecast'}
        </button>
      </header>

      <div className="flex flex-wrap gap-3">
        {STATEMENT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveStatement(tab.id)}
            className={`px-4 py-2 rounded-full border text-sm font-semibold transition-all ${
              activeStatement === tab.id
                ? 'bg-wip-gold-dark text-white border-wip-gold-dark shadow-lg shadow-wip-gold/30'
                : 'border-slate-300 text-slate-600 dark:text-slate-300 hover:border-orange-400'
            }`}
          >
            {tab.label}
            <span className="ml-2 text-xs text-slate-500">{tab.description}</span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {statementLineItems.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-slate-500">
            Import historical data to populate chart of accounts.
          </div>
        )}

        {statementLineItems.map((line) => {
          const draft = drafts[line.id];
          const methodDefinition = draft ? FORECAST_METHOD_DEFINITIONS[draft.methodology as keyof typeof FORECAST_METHOD_DEFINITIONS] : null;
          const series = getSeriesForLine(line.id);
          const lastValue = series.length ? series[series.length - 1].amount : 0;
          const trailingAvg = average(series.slice(-12).map((point) => point.amount));
          const preview = previews[line.id];

          return (
            <div key={line.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-wrap items-start gap-4 justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{line.lineName}</h3>
                  <p className="text-sm text-slate-500">{line.lineCategory || 'Uncategorized'} · Code {line.lineCode}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase text-slate-500 tracking-wider">Last Actual</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(lastValue)}</p>
                  <p className="text-xs text-slate-400">Avg 12 mo: {formatCurrency(trailingAvg)}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500">Methodology</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-wip-gold"
                    value={draft?.methodology ?? 'run_rate'}
                    onChange={(event) =>
                      handleDraftChange(line.id, () => {
                        const newMethod = event.target.value as keyof typeof FORECAST_METHOD_DEFINITIONS;
                        const defaults =
                          FORECAST_METHOD_DEFINITIONS[newMethod]?.parameters.reduce<Record<string, any>>(
                            (acc, param) => ({ ...acc, [param.key]: param.defaultValue }),
                            {}
                          ) ?? {};
                        return {
                          methodology: newMethod,
                          parameters: defaults,
                        };
                      })
                    }
                  >
                    {METHOD_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {methodDefinition && <p className="text-xs text-slate-400 mt-1">{methodDefinition.description}</p>}
                </div>

                {methodDefinition?.parameters.map((parameter) => (
                  <ParameterInput
                    key={`${line.id}-${parameter.key}`}
                    parameter={parameter}
                    value={draft?.parameters?.[parameter.key]}
                    onChange={(nextValue) =>
                      handleDraftChange(line.id, (prev) => ({
                        ...prev,
                        parameters: {
                          ...(prev?.parameters ?? {}),
                          [parameter.key]: nextValue,
                        },
                      }))
                    }
                  />
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleSave(line.id)}
                  disabled={!companyId || methodsLoading}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-orange-400 disabled:opacity-50"
                >
                  Save Methodology
                </button>
                <button
                  type="button"
                  onClick={() => handlePreview(line)}
                  disabled={!companyId || running}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-3 py-2 text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
                >
                  Preview Next 12 Months
                </button>
                {preview && (
                  <div className="text-sm text-slate-500">
                    Next 3 months: {preview.slice(0, 3).map((point) => formatCurrency(point.value)).join(' · ')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
            toastType === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast}
        </div>
      )}
    </section>
  );
};

export default MethodologyPanel;

