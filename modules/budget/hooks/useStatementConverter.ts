import { useCallback, useMemo, useState } from 'react';
import {
  buildColumnSamples,
  buildTemplateCsv,
  ColumnSample,
  convertRows,
  ConverterMapping,
  defaultMapping,
  detectMonthColumns,
  MonthColumn,
  parseWorkbookFile,
  RawTableData,
  summarizeConvertedLines,
} from '../lib/converter';
import { StatementType } from '../types';

export interface ConverterState {
  fileName: string | null;
  rawData: RawTableData | null;
  columnSamples: ColumnSample[];
  monthColumns: MonthColumn[];
  mapping: ConverterMapping | null;
  loading: boolean;
  error: string | null;
  convertedRows: ReturnType<typeof convertRows>;
  summary: ReturnType<typeof summarizeConvertedLines>;
}

export function useStatementConverter() {
  const [state, setState] = useState<ConverterState>({
    fileName: null,
    rawData: null,
    columnSamples: [],
    monthColumns: [],
    mapping: null,
    loading: false,
    error: null,
    convertedRows: [],
    summary: { rowCount: 0 },
  });

  const loadFile = useCallback(async (file: File) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const rawData = await parseWorkbookFile(file);
      const monthColumns = detectMonthColumns(rawData.headers);
      if (!monthColumns.length) {
        throw new Error('Could not detect any month columns. Please ensure the header row contains month labels (e.g., Jan 2024).');
      }

      const mapping = defaultMapping(
        rawData.headers,
        monthColumns.map((month) => month.header)
      );

      const convertedRows = convertRows(rawData.rows, mapping, monthColumns);
      const summary = summarizeConvertedLines(convertedRows);

      setState({
        fileName: file.name,
        rawData,
        columnSamples: buildColumnSamples(rawData.rows, rawData.headers),
        monthColumns,
        mapping,
        loading: false,
        error: null,
        convertedRows,
        summary,
      });
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to parse file.',
        rawData: null,
        columnSamples: [],
        monthColumns: [],
        mapping: null,
        convertedRows: [],
        summary: { rowCount: 0 },
      }));
    }
  }, []);

  const updateMapping = useCallback(
    (updates: Partial<ConverterMapping>) => {
      setState((prev) => {
        if (!prev.mapping || !prev.rawData) return prev;
        const nextMapping: ConverterMapping = { ...prev.mapping, ...updates };
        const convertedRows = convertRows(prev.rawData.rows, nextMapping, prev.monthColumns);
        return {
          ...prev,
          mapping: nextMapping,
          convertedRows,
          summary: summarizeConvertedLines(convertedRows),
          error: convertedRows.length === 0 ? 'No rows matched the current mapping.' : null,
        };
      });
    },
    []
  );

  const updateMonthHeaders = useCallback((headers: string[]) => {
    updateMapping({ monthHeaders: headers });
  }, [updateMapping]);

  const setStatementMode = useCallback(
    (mode: ConverterMapping['statementMode'], value?: StatementType | string) => {
      if (mode === 'single') {
        updateMapping({ statementMode: 'single', singleStatement: (value as StatementType) ?? 'income_statement', statementColumn: undefined });
      } else {
        updateMapping({ statementMode: 'column', statementColumn: value as string });
      }
    },
    [updateMapping]
  );

  const buildCsvFile = useCallback(() => {
    if (!state.mapping || !state.convertedRows.length) return null;
    const selectedPeriods = state.monthColumns
      .filter((month) => state.mapping?.monthHeaders.includes(month.header))
      .map((month) => month.period);
    if (!selectedPeriods.length) return null;

    const csv = buildTemplateCsv(state.convertedRows, selectedPeriods);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    return new File([blob], `converted-${Date.now()}.csv`, { type: 'text/csv' });
  }, [state.convertedRows, state.mapping, state.monthColumns]);

  const reset = useCallback(() => {
    setState({
      fileName: null,
      rawData: null,
      columnSamples: [],
      monthColumns: [],
      mapping: null,
      loading: false,
      error: null,
      convertedRows: [],
      summary: { rowCount: 0 },
    });
  }, []);

  return {
    ...state,
    loadFile,
    updateMapping,
    updateMonthHeaders,
    setStatementMode,
    buildCsvFile,
    reset,
  };
}

