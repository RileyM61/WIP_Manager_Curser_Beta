import React, { useMemo, useState } from 'react';
import { useStatementConverter } from '../hooks/useStatementConverter';
import { useForecastImports } from '../hooks/useForecastImports';
import { StatementType } from '../types';
interface StatementConverterPanelProps {
  companyId: string | null;
  onImportComplete?: () => void;
}
const STATEMENT_OPTIONS: { value: StatementType; label: string }[] = [
  { value: 'income_statement', label: 'Income Statement' },
  { value: 'balance_sheet', label: 'Balance Sheet' },
];
const StatementConverterPanel: React.FC<StatementConverterPanelProps> = ({ companyId, onImportComplete }) => {
  const {
    fileName,
    loadFile,
    mapping,
    columnSamples,
    monthColumns,
    updateMapping,
    updateMonthHeaders,
    setStatementMode,
    buildCsvFile,
    summary,
    convertedRows,
    loading,
    error,
    reset,
  } = useStatementConverter();
  const { importHistorical, importActuals, importing } = useForecastImports(companyId);
  const [importTarget, setImportTarget] = useState<'history' | 'actuals'>('history');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const selectedMonthColumns = useMemo(() => {
    if (!mapping) return [];
    return monthColumns.filter((month) => mapping.monthHeaders.includes(month.header));
  }, [mapping, monthColumns]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await loadFile(file);
    }
  };

  const handleCheckboxToggle = (header: string) => {
    if (!mapping) return;
    const current = new Set(mapping.monthHeaders);
    if (current.has(header)) {
      current.delete(header);
    } else {
      current.add(header);
    }
    updateMonthHeaders(Array.from(current));
  };

  const handleDownload = () => {
    const file = buildCsvFile();
    if (!file) {
      setStatusMessage('No converted rows to download.');
      return;
    }
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatusMessage(`Downloaded ${file.name}`);
  };

  const handleSendToImport = async () => {
    const file = buildCsvFile();
    if (!file || !companyId) {
      setStatusMessage('Upload and map a file first.');
      return;
    }

    try {
      if (importTarget === 'history') {
        await importHistorical(file);
      } else {
        await importActuals(file);
      }
      setStatusMessage(`Converted file sent to ${importTarget === 'history' ? '36-Month History' : 'Monthly Actuals'} import.`);
      onImportComplete?.();
    } catch (err: any) {
      setStatusMessage(err.message || 'Failed to send converted file to import.');
    }
  };

  const isActionDisabled = !mapping || !convertedRows.length || !companyId;

  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs font-semibold text-orange-600 uppercase tracking-[0.2em] mb-2">Format Converter (Beta)</p>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Convert QuickBooks exports into the required template</h3>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Upload a P&L or Balance Sheet file, map the columns once, and either download the converted template or send it straight into the importer.
        </p>
      </header>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">1. Upload raw export</p>
            <p className="text-xs text-slate-500">Supports .xlsx / .xls / .csv (QuickBooks P&L by Month recommended)</p>
          </div>
          <div className="flex items-center gap-3">
            {fileName && (
              <span className="text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {fileName}
              </span>
            )}
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer hover:border-orange-400">
              <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileChange} disabled={loading} />
              {loading ? 'Parsing…' : 'Choose File'}
            </label>
            {fileName && (
              <button
                type="button"
                className="text-xs text-slate-500 underline"
                onClick={() => reset()}
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {mapping && (
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">2. Column mapping</p>
                <div className="grid gap-3">
                  <FieldSelect
                    label="Line Name Column"
                    value={mapping.lineNameColumn}
                    options={columnSamples}
                    onChange={(value) => updateMapping({ lineNameColumn: value })}
                    required
                  />
                  <FieldSelect
                    label="Line Code Column (optional)"
                    value={mapping.lineCodeColumn || ''}
                    options={columnSamples}
                    placeholder="Auto-generate"
                    onChange={(value) => updateMapping({ lineCodeColumn: value || undefined })}
                  />
                  <FieldSelect
                    label="Category Column"
                    value={mapping.categoryColumn || ''}
                    options={columnSamples}
                    placeholder="None"
                    onChange={(value) => updateMapping({ categoryColumn: value || undefined })}
                  />
                  <FieldSelect
                    label="Subcategory Column"
                    value={mapping.subcategoryColumn || ''}
                    options={columnSamples}
                    placeholder="None"
                    onChange={(value) => updateMapping({ subcategoryColumn: value || undefined })}
                  />
                  <div className="grid gap-2">
                    <label className="text-xs font-semibold text-slate-500">Statement</label>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="statementMode"
                          value="single"
                          checked={mapping.statementMode === 'single'}
                          onChange={() => setStatementMode('single', mapping.singleStatement)}
                        />
                        Entire file =
                        <select
                          className="ml-2 border rounded px-2 py-1 text-sm"
                          value={mapping.singleStatement}
                          onChange={(event) => setStatementMode('single', event.target.value as StatementType)}
                          disabled={mapping.statementMode !== 'single'}
                        >
                          {STATEMENT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="statementMode"
                          value="column"
                          checked={mapping.statementMode === 'column'}
                          onChange={() => setStatementMode('column', mapping.statementColumn || columnSamples[0]?.key)}
                        />
                        Use column:
                        <select
                          className="ml-2 border rounded px-2 py-1 text-sm"
                          value={mapping.statementColumn || ''}
                          onChange={(event) => setStatementMode('column', event.target.value)}
                          disabled={mapping.statementMode !== 'column'}
                        >
                          {columnSamples.map((option) => (
                            <option key={option.key} value={option.key}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-semibold text-slate-500">Defaults</label>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Default category"
                        value={mapping.defaultCategory || ''}
                        onChange={(event) => updateMapping({ defaultCategory: event.target.value })}
                        className="border rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800"
                      />
                      <input
                        type="text"
                        placeholder="Default subcategory"
                        value={mapping.defaultSubcategory || ''}
                        onChange={(event) => updateMapping({ defaultSubcategory: event.target.value })}
                        className="border rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={mapping.skipTotalRows}
                        onChange={(event) => updateMapping({ skipTotalRows: event.target.checked })}
                      />
                      Skip rows that look like totals
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={mapping.skipZeroRows}
                        onChange={(event) => updateMapping({ skipZeroRows: event.target.checked })}
                      />
                      Skip rows with all zeros
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">3. Month selection</p>
                <p className="text-xs text-slate-500">
                  {selectedMonthColumns.length} months selected (range {summary.periodStart ?? '—'} → {summary.periodEnd ?? '—'})
                </p>
                <div className="max-h-64 overflow-y-auto border rounded-xl border-slate-200 dark:border-slate-700 p-3 grid grid-cols-2 gap-2 text-sm">
                  {monthColumns.map((month) => (
                    <label key={month.header} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={mapping.monthHeaders.includes(month.header)}
                        onChange={() => handleCheckboxToggle(month.header)}
                      />
                      <span>{month.header}</span>
                    </label>
                  ))}
                </div>
                {importTarget === 'history' && selectedMonthColumns.length < 24 && (
                  <p className="text-xs text-amber-600">
                    History import expects ~36 months of data. We detected {selectedMonthColumns.length}. Add more months or switch to monthly actuals.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">4. Preview ({convertedRows.length} rows)</p>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-xs">
                    <tr>
                      <th className="px-3 py-2 text-left">Statement</th>
                      <th className="px-3 py-2 text-left">Line Name</th>
                      <th className="px-3 py-2 text-left">Category</th>
                      <th className="px-3 py-2 text-left">Subcategory</th>
                      {selectedMonthColumns.slice(0, 4).map((month) => (
                        <th key={month.header} className="px-3 py-2 text-right">
                          {month.period}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {convertedRows.slice(0, 8).map((row) => (
                      <tr key={row.lineCode} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="px-3 py-2 text-slate-500">{row.statement === 'income_statement' ? 'Income' : 'Balance'}</td>
                        <td className="px-3 py-2 font-semibold text-slate-900 dark:text-white">{row.lineName}</td>
                        <td className="px-3 py-2 text-slate-500">{row.category || '—'}</td>
                        <td className="px-3 py-2 text-slate-500">{row.subcategory || '—'}</td>
                        {selectedMonthColumns.slice(0, 4).map((month) => (
                          <td key={month.period} className="px-3 py-2 text-right text-slate-500">
                            {(row.values[month.period] ?? 0).toLocaleString()}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <span>Send directly to:</span>
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="radio"
                      name="importTarget"
                      value="history"
                      checked={importTarget === 'history'}
                      onChange={() => setImportTarget('history')}
                    />
                    36-Month History
                  </label>
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="radio"
                      name="importTarget"
                      value="actuals"
                      checked={importTarget === 'actuals'}
                      onChange={() => setImportTarget('actuals')}
                    />
                    Monthly Actuals
                  </label>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isActionDisabled}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-50"
                >
                  Download Converted CSV
                </button>
                <button
                  type="button"
                  onClick={handleSendToImport}
                  disabled={isActionDisabled || importing}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {importing ? 'Sending…' : `Send to ${importTarget === 'history' ? 'History' : 'Actuals'} Import`}
                </button>
              </div>
              {statusMessage && <p className="text-xs text-slate-500">{statusMessage}</p>}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

interface FieldSelectProps {
  label: string;
  value: string;
  options: { key: string; label: string; samples: string[] }[];
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}

const FieldSelect: React.FC<FieldSelectProps> = ({ label, value, options, onChange, required, placeholder }) => {
  return (
    <div className="grid gap-1">
      <label className="text-xs font-semibold text-slate-500">{label}</label>
      <select
        className="border rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {!required && (
          <option value="">
            {placeholder || 'None'}
          </option>
        )}
        {options.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label} {option.samples.length ? `(${option.samples.join(', ')})` : ''}
          </option>
        ))}
      </select>
    </div>
  );
};

export default StatementConverterPanel;

