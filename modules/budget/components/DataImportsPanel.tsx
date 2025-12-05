import React, { useMemo, useState } from 'react';
import { useForecastImports } from '../hooks/useForecastImports';
import { ImportResult } from '../types';

interface DataImportsPanelProps {
  companyId: string | null;
  onImportComplete?: () => void;
}

interface UploadCardProps {
  title: string;
  description: string;
  templateMonths: number;
  onUpload: (file: File) => Promise<void>;
  disabled: boolean;
  isBusy: boolean;
}

const UploadCard: React.FC<UploadCardProps> = ({
  title,
  description,
  templateMonths,
  onUpload,
  disabled,
  isBusy,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await onUpload(file);
      setSuccess('File imported successfully.');
      setFile(null);
    } catch (err: any) {
      setError(err.message || 'Import failed. Please double-check the template.');
    }
  };

  const handleTemplateDownload = () => {
    const headers = ['Statement', 'Line Code', 'Line Name', 'Category', 'Subcategory', ...generateRollingHeaders(templateMonths)];
    const sampleRow = ['Income Statement', 'REV_TOTAL', 'Total Revenue', 'Revenue', 'Contract Revenue'];
    const csv = [headers.join(','), sampleRow.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '-')}-template.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
        </div>
        <button
          type="button"
          onClick={handleTemplateDownload}
          className="text-sm text-orange-600 dark:text-orange-400 font-medium hover:underline disabled:opacity-60"
          disabled={disabled || isBusy}
        >
          Download Template
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className={`block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-orange-400'}`}>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            disabled={disabled || isBusy}
            onChange={(event) => {
              const nextFile = event.target.files?.[0] ?? null;
              setFile(nextFile);
              setError(null);
              setSuccess(null);
            }}
          />
          <div className="text-gray-600 dark:text-gray-400">
            {file ? (
              <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
            ) : (
              <>
                <p className="font-semibold text-gray-900 dark:text-white">Drop Excel/CSV file here</p>
                <p className="text-sm">Accepted: .xlsx, .xls, .csv</p>
              </>
            )}
          </div>
        </label>

        <button
          type="submit"
          disabled={!file || disabled || isBusy}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 text-white font-semibold py-3 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-orange-500 transition-colors"
        >
          {isBusy ? (
            <>
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
              </svg>
              Processing...
            </>
          ) : (
            'Upload & Process'
          )}
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-emerald-600">{success}</p>}
      </form>
    </div>
  );
};

function generateRollingHeaders(months: number): string[] {
  const headers: string[] = [];
  const current = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(current.getFullYear(), current.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    headers.push(`${year}-${month}`);
  }
  return headers;
}

const ResultSummary: React.FC<{ result: ImportResult | null }> = ({ result }) => {
  if (!result) return null;

  return (
    <div className="mt-6 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <div>
        <p className="text-xs uppercase text-slate-500 tracking-wider">Rows</p>
        <p className="text-lg font-semibold text-slate-900 dark:text-white">{result.processedRows}</p>
      </div>
      <div>
        <p className="text-xs uppercase text-slate-500 tracking-wider">New Lines</p>
        <p className="text-lg font-semibold text-slate-900 dark:text-white">{result.createdLineItems}</p>
      </div>
      <div>
        <p className="text-xs uppercase text-slate-500 tracking-wider">Records</p>
        <p className="text-lg font-semibold text-slate-900 dark:text-white">{result.insertedRecords}</p>
      </div>
      {typeof result.restatedRecords === 'number' && (
        <div>
          <p className="text-xs uppercase text-slate-500 tracking-wider">Restated</p>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">{result.restatedRecords}</p>
        </div>
      )}
    </div>
  );
};

export const DataImportsPanel: React.FC<DataImportsPanelProps> = ({ companyId, onImportComplete }) => {
  const { importing, statusMessage, lastResult, importHistorical, importActuals } = useForecastImports(companyId);

  const disabled = !companyId;
  const statusColor = statusMessage?.toLowerCase().includes('failed') ? 'text-red-600' : 'text-slate-600';

  const historicalCard = useMemo(() => ({
    title: '36-Month History Import',
    description: 'Import three full years of monthly Income Statement and Balance Sheet data to build the baseline forecast.',
    months: 36,
    action: async (file: File) => {
      await importHistorical(file);
      onImportComplete?.();
    },
  }), [importHistorical, onImportComplete]);

  const actualsCard = useMemo(() => ({
    title: 'Monthly Actuals Update',
    description: 'Replace the current month forecast with actuals (plus prior 11 months to capture restatements).',
    months: 12,
    action: async (file: File) => {
      await importActuals(file);
      onImportComplete?.();
    },
  }), [importActuals, onImportComplete]);

  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs font-semibold text-orange-600 uppercase tracking-[0.2em] mb-2">Data Ingestion</p>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Import Financial Statements</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-3xl mt-2">
          Start by importing 36 months of historical Income Statement and Balance Sheet detail. Each month, upload the latest actuals plus the previous 11 months to keep the system in sync with your accounting restatements.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <UploadCard
          title={historicalCard.title}
          description={historicalCard.description}
          templateMonths={historicalCard.months}
          onUpload={historicalCard.action}
          disabled={disabled}
          isBusy={importing}
        />
        <UploadCard
          title={actualsCard.title}
          description={actualsCard.description}
          templateMonths={actualsCard.months}
          onUpload={actualsCard.action}
          disabled={disabled}
          isBusy={importing}
        />
      </div>

      {statusMessage && (
        <div className={`text-sm ${statusColor} bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3`}>
          {statusMessage}
        </div>
      )}

      <ResultSummary result={lastResult} />

      {disabled && (
        <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          Select a company to enable imports.
        </div>
      )}

    </section>
  );
};

export default DataImportsPanel;

