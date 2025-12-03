import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { DataImportsPanel } from './DataImportsPanel';
import MethodologyPanel from './MethodologyPanel';
import VarianceDashboard from './VarianceDashboard';
import { useForecastLineItems } from '../hooks/useForecastLineItems';
import { useForecastMethodologies } from '../hooks/useForecastMethodologies';
import { useForecastEngine } from '../hooks/useForecastEngine';
import { useForecastVariance } from '../hooks/useForecastVariance';
import { StatementType } from '../types';

const STATEMENT_LABELS: Record<StatementType, string> = {
  income_statement: 'Income Statement',
  balance_sheet: 'Balance Sheet',
};

const ForecastVsActualsPage: React.FC = () => {
  const { companyId } = useAuth();
  const { lineItems, groupedByStatement, loading, refresh } = useForecastLineItems(companyId ?? null);
  const methodHook = useForecastMethodologies(companyId ?? null);
  const engineHook = useForecastEngine(companyId ?? null);
  const varianceHook = useForecastVariance(companyId ?? null, lineItems);
  const [activeSection, setActiveSection] = useState<'imports' | 'methodologies' | 'dashboard'>('imports');
  const [autoRunForecast, setAutoRunForecast] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = window.localStorage.getItem('forecast-auto-run');
    return stored ? stored === 'true' : true;
  });
  const [autoRefreshVariance, setAutoRefreshVariance] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = window.localStorage.getItem('forecast-auto-variance');
    return stored ? stored === 'true' : true;
  });
  const [automationRunning, setAutomationRunning] = useState(false);
  const [automationLog, setAutomationLog] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('forecast-auto-run', String(autoRunForecast));
    }
  }, [autoRunForecast]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('forecast-auto-variance', String(autoRefreshVariance));
    }
  }, [autoRefreshVariance]);

  const buildConfigMap = () => {
    return lineItems.reduce<Record<string, any>>((acc, line) => {
      const config = methodHook.getConfigForLine(line.id);
      acc[line.id] = {
        id: config.id,
        companyId: companyId ?? config.companyId ?? '',
        lineItemId: line.id,
        methodology: config.methodology,
        parameters: config.parameters,
        isActive: true,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      };
      return acc;
    }, {});
  };

  const handleAutomationRun = async (force: boolean) => {
    if (!companyId || lineItems.length === 0) {
      setAutomationLog('Add line items and company to run automation.');
      return;
    }

    const shouldRunForecast = force || autoRunForecast;
    const shouldRefreshVariance = force || autoRefreshVariance;

    if (!shouldRunForecast && !shouldRefreshVariance) {
      setAutomationLog('Enable an automation toggle or run manual forecast first.');
      return;
    }

    setAutomationRunning(true);
    try {
      if (shouldRunForecast) {
        const configMap = buildConfigMap();
        await engineHook.runForecast({
          lineItems,
          configs: configMap,
          months: 12,
          persist: true,
        });
        await refresh();
      }

      if (shouldRefreshVariance) {
        await varianceHook.refresh();
      }

      setAutomationLog(force ? 'Manual automation completed.' : 'Automation run after import.');
      methodHook.refresh?.();
    } catch (err: any) {
      setAutomationLog(err.message || 'Automation failed.');
    } finally {
      setAutomationRunning(false);
    }
  };

  const totalLineItems = lineItems.length;
  const activeLabel = useMemo(() => {
    switch (activeSection) {
      case 'imports':
        return 'Data Ingestion';
      case 'methodologies':
        return 'Forecast Methodologies';
      case 'dashboard':
        return 'Variance & KPIs';
      default:
        return '';
    }
  }, [activeSection]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] font-semibold text-orange-500">Forecast vs Actuals</p>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Build a Rolling 12-Month Financial Forecast</h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-3xl">
            Import 36 months of history, configure per-line forecasting methodologies, and automatically replace forecasted periods with actuals each month. Compare current period, year-to-date, and prior year performance for both the Income Statement and Balance Sheet.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <p className="text-xs uppercase text-slate-500 font-semibold tracking-wider">Total Lines</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{loading ? '...' : totalLineItems}</p>
              <p className="text-sm text-slate-500 mt-1">Split across Income Statement and Balance Sheet</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <p className="text-xs uppercase text-slate-500 font-semibold tracking-wider">Rolling Forecast</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">12 Months</p>
              <p className="text-sm text-slate-500 mt-1">Auto-rebuild after each import</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <p className="text-xs uppercase text-slate-500 font-semibold tracking-wider">Focus Area</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{activeLabel}</p>
              <p className="text-sm text-slate-500 mt-1">Use the tabs below to work step-by-step</p>
            </div>
          </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase text-orange-600 tracking-[0.3em] font-semibold">Automation</p>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Keep forecasts and variance fresh</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Automatically rebuild forecasts after imports and refresh the variance cache for consistent reporting.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleAutomationRun(true)}
              disabled={automationRunning || lineItems.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold disabled:opacity-60"
            >
              {automationRunning ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                  </svg>
                  Running...
                </>
              ) : (
                'Run Automation Now'
              )}
            </button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <ToggleCard
              label="Auto-run forecast after imports"
              description="Rebuild the 12-month forecast as soon as new data lands."
              checked={autoRunForecast}
              onChange={() => setAutoRunForecast((prev) => !prev)}
            />
            <ToggleCard
              label="Auto-refresh variance cache"
              description="Recalculate current period and YTD variances after imports."
              checked={autoRefreshVariance}
              onChange={() => setAutoRefreshVariance((prev) => !prev)}
            />
          </div>
          {automationLog && (
            <p className="mt-3 text-sm text-slate-500">{automationLog}</p>
          )}
        </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setActiveSection('imports')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeSection === 'imports' ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-orange-300'}`}
            >
              Data Imports
            </button>
            <button
              onClick={() => setActiveSection('methodologies')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeSection === 'methodologies' ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-orange-300'}`}
            >
              Forecast Engine
            </button>
            <button
              onClick={() => setActiveSection('dashboard')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeSection === 'dashboard' ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-orange-300'}`}
            >
              Variance Reporting
            </button>
          </div>
        </header>

        {activeSection === 'imports' && (
          <DataImportsPanel
            companyId={companyId ?? null}
            onImportComplete={async () => {
              await refresh();
              if (autoRunForecast || autoRefreshVariance) {
                await handleAutomationRun(false);
              }
            }}
          />
        )}

        {activeSection === 'methodologies' && (
          <MethodologyPanel
            companyId={companyId ?? null}
            lineItems={lineItems}
            onForecastRun={() => {
              refresh();
            }}
            methodHook={methodHook}
            engineHook={engineHook}
          />
        )}

        {activeSection === 'dashboard' && (
          <VarianceDashboard lineItems={lineItems} varianceHook={varianceHook} />
        )}
      </div>
    </div>
  );
};

const ToggleCard: React.FC<{
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}> = ({ label, description, checked, onChange }) => {
  return (
    <label className="flex items-start gap-3 border rounded-2xl border-slate-200 dark:border-slate-800 p-4 cursor-pointer">
      <div
        className={`mt-1 w-12 h-6 rounded-full transition-colors ${checked ? 'bg-orange-500' : 'bg-slate-300'}`}
        onClick={(event) => {
          event.preventDefault();
          onChange();
        }}
      >
        <span
          className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </div>
      <div>
        <p className="font-semibold text-slate-900 dark:text-white">{label}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </label>
  );
};

export default ForecastVsActualsPage;

