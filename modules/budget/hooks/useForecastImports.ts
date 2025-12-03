import { useCallback, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  ImportResult,
  StatementType,
} from '../types';
import {
  ParsedLineRow,
  parseFinancialWorkbook,
  summarizePeriods,
  summarizeStatements,
} from '../lib/importUtils';

interface LineItemMapEntry {
  id: string;
  statementType: StatementType;
  lineCode: string;
}

interface EnsureLineItemsResult {
  map: Map<string, LineItemMapEntry>;
  created: number;
  existing: number;
}

type ImportType = 'historical' | 'actuals';

function buildLineKey(statement: StatementType, lineCode: string) {
  return `${statement}:${lineCode.toLowerCase()}`;
}

function chunkArray<T>(items: T[], size = 500): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export function useForecastImports(companyId: string | null) {
  const [importing, setImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ImportResult | null>(null);

  const ensureLineItems = useCallback(
    async (rows: ParsedLineRow[]): Promise<EnsureLineItemsResult> => {
      if (!companyId) throw new Error('Missing company ID');

      const uniqueKeys = new Map<string, ParsedLineRow>();
      rows.forEach((row) => {
        const key = buildLineKey(row.statementType, row.lineCode);
        if (!uniqueKeys.has(key)) {
          uniqueKeys.set(key, row);
        }
      });

      const { data: existing, error } = await supabase
        .from('forecast_line_items')
        .select('id, statement_type, line_code')
        .eq('company_id', companyId)
        .in('statement_type', ['income_statement', 'balance_sheet']);

      if (error) throw error;

      const map = new Map<string, LineItemMapEntry>();
      (existing || []).forEach((row) => {
        map.set(buildLineKey(row.statement_type, row.line_code), {
          id: row.id,
          statementType: row.statement_type,
          lineCode: row.line_code,
        });
      });

      const toInsert = Array.from(uniqueKeys.entries())
        .filter(([key]) => !map.has(key))
        .map(([, row], index) => ({
          company_id: companyId,
          statement_type: row.statementType,
          line_code: row.lineCode,
          line_name: row.lineName,
          line_category: row.lineCategory,
          line_subcategory: row.lineSubcategory,
          display_order: index,
          is_calculated: false,
          is_active: true,
        }));

      if (toInsert.length) {
        const { data: inserted, error: insertError } = await supabase
          .from('forecast_line_items')
          .insert(toInsert)
          .select('id, statement_type, line_code');

        if (insertError) throw insertError;

        (inserted || []).forEach((row) => {
          const key = buildLineKey(row.statement_type, row.line_code);
          map.set(key, {
            id: row.id,
            statementType: row.statement_type,
            lineCode: row.line_code,
          });
        });
      }

      return {
        map,
        created: toInsert.length,
        existing: map.size - toInsert.length,
      };
    },
    [companyId]
  );

  const createImportBatch = useCallback(
    async (
      type: ImportType,
      statementType: StatementType | 'both',
      file: File,
      rowCount: number,
      periodStart: string,
      periodEnd: string
    ) => {
      if (!companyId) throw new Error('Missing company ID');

      const { data, error } = await supabase
        .from('forecast_import_batches')
        .insert({
          company_id: companyId,
          import_type: type,
          statement_type: statementType,
          file_name: file.name,
          period_start: periodStart,
          period_end: periodEnd,
          row_count: rowCount,
          status: 'processing',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    [companyId]
  );

  const finalizeBatch = useCallback(async (batchId: string, status: 'completed' | 'failed', errorMessage?: string) => {
    const updates: Record<string, any> = {
      status,
      completed_at: new Date().toISOString(),
    };
    if (errorMessage) updates.error_message = errorMessage;

    const { error } = await supabase
      .from('forecast_import_batches')
      .update(updates)
      .eq('id', batchId);

    if (error) {
      console.error('[useForecastImports] failed to finalize batch', error);
    }
  }, []);

  const importHistorical = useCallback(
    async (file: File) => {
      if (!companyId) throw new Error('Select a company before importing.');

      setImporting(true);
      setStatusMessage('Parsing workbook...');
      setLastResult(null);

      try {
        const parsed = await parseFinancialWorkbook(file, { minimumPeriods: 24 });
        setStatusMessage('Preparing chart of accounts...');
        const { map, created, existing } = await ensureLineItems(parsed);
        const { start, end } = summarizePeriods(parsed);
        const statementSummary = summarizeStatements(parsed);

        setStatusMessage('Creating import batch...');
        const batch = await createImportBatch('historical', statementSummary, file, parsed.length, start, end);

        const rows = parsed.flatMap((row) => {
          const key = buildLineKey(row.statementType, row.lineCode);
          const entry = map.get(key);
          if (!entry) return [];

          return row.values.map((value) => {
            const [year, month] = value.period.split('-');
            return {
              company_id: companyId,
              line_item_id: entry.id,
              period_year: Number(year),
              period_month: Number(month),
              amount: value.amount,
              import_batch_id: batch.id,
            };
          });
        });

        if (!rows.length) {
          throw new Error('No historical amounts were extracted from the file.');
        }

        setStatusMessage(`Uploading ${rows.length} historical data points...`);
        for (const chunk of chunkArray(rows)) {
          const { error } = await supabase
            .from('forecast_historical_data')
            .upsert(chunk, {
              onConflict: 'company_id,line_item_id,period_year,period_month',
            });

          if (error) throw error;
        }

        await finalizeBatch(batch.id, 'completed');

        const result: ImportResult = {
          processedRows: parsed.length,
          createdLineItems: created,
          updatedLineItems: existing,
          insertedRecords: rows.length,
          batchId: batch.id,
        };
        setLastResult(result);
        setStatusMessage('Historical import completed.');
        return result;
      } catch (err: any) {
        console.error('[useForecastImports] historical import failed', err);
        setStatusMessage(err.message || 'Historical import failed');
        setLastResult({
          processedRows: 0,
          createdLineItems: 0,
          updatedLineItems: 0,
          insertedRecords: 0,
          warnings: [err.message || 'Unknown error'],
        });
        throw err;
      } finally {
        setImporting(false);
      }
    },
    [companyId, ensureLineItems, createImportBatch, finalizeBatch]
  );

  const importActuals = useCallback(
    async (file: File) => {
      if (!companyId) throw new Error('Select a company before importing.');

      setImporting(true);
      setStatusMessage('Parsing workbook...');
      setLastResult(null);

      try {
        const parsed = await parseFinancialWorkbook(file, { minimumPeriods: 1 });
        const { map, created, existing } = await ensureLineItems(parsed);
        const { start, end } = summarizePeriods(parsed);
        const statementSummary = summarizeStatements(parsed);

        const batch = await createImportBatch('actuals', statementSummary, file, parsed.length, start, end);

        const uniqueLineIds = new Set<string>();
        const uniquePeriods = new Set<string>();

        parsed.forEach((row) => {
          const key = buildLineKey(row.statementType, row.lineCode);
          const entry = map.get(key);
          if (!entry) return;
          uniqueLineIds.add(entry.id);
          row.values.forEach((value) => uniquePeriods.add(value.period));
        });

        if (uniqueLineIds.size === 0) {
          throw new Error('No recognizable line items were found in the uploaded file.');
        }

        const periodList = Array.from(uniquePeriods).map((period) => {
          const [year, month] = period.split('-').map(Number);
          return { year, month };
        });

        if (!periodList.length) {
          throw new Error('No valid period columns were detected in the file.');
        }

        const minYear = Math.min(...periodList.map((p) => p.year));
        const maxYear = Math.max(...periodList.map((p) => p.year));

        const { data: existingActuals, error: existingError } = await supabase
          .from('forecast_actuals')
          .select('line_item_id, period_year, period_month, actual_amount')
          .eq('company_id', companyId)
          .gte('period_year', minYear)
          .lte('period_year', maxYear)
          .in('line_item_id', Array.from(uniqueLineIds));

        if (existingError) throw existingError;

        const existingMap = new Map<string, number>();
        (existingActuals || []).forEach((row) => {
          const key = `${row.line_item_id}:${row.period_year}-${row.period_month}`;
          existingMap.set(key, Number(row.actual_amount));
        });

        const rows = parsed.flatMap((row) => {
          const key = buildLineKey(row.statementType, row.lineCode);
          const entry = map.get(key);
          if (!entry) return [];

          return row.values.map((value) => {
            const [year, month] = value.period.split('-');
            const rowKey = `${entry.id}:${year}-${Number(month)}`;
            const previous = existingMap.get(rowKey);
            const amount = value.amount;
            const isRestated = typeof previous === 'number' && previous !== amount;

            return {
              company_id: companyId,
              line_item_id: entry.id,
              period_year: Number(year),
              period_month: Number(month),
              actual_amount: amount,
              import_batch_id: batch.id,
              is_restated: isRestated,
              prior_amount: isRestated ? previous : null,
            };
          });
        });

        if (!rows.length) {
          throw new Error('No actuals were detected in the uploaded file.');
        }

        let restatedCount = 0;
        rows.forEach((row) => {
          if (row.is_restated) restatedCount += 1;
        });

        setStatusMessage(`Uploading ${rows.length} actuals...`);
        for (const chunk of chunkArray(rows)) {
          const { error } = await supabase
            .from('forecast_actuals')
            .upsert(chunk, {
              onConflict: 'company_id,line_item_id,period_year,period_month',
            });

          if (error) throw error;
        }

        await finalizeBatch(batch.id, 'completed');

        const result: ImportResult = {
          processedRows: parsed.length,
          createdLineItems: created,
          updatedLineItems: existing,
          insertedRecords: rows.length,
          restatedRecords: restatedCount,
          batchId: batch.id,
        };
        setLastResult(result);
        setStatusMessage('Actuals import completed.');
        return result;
      } catch (err: any) {
        console.error('[useForecastImports] actuals import failed', err);
        setStatusMessage(err.message || 'Actuals import failed');
        setLastResult({
          processedRows: 0,
          createdLineItems: 0,
          updatedLineItems: 0,
          insertedRecords: 0,
          warnings: [err.message || 'Unknown error'],
        });
        throw err;
      } finally {
        setImporting(false);
      }
    },
    [companyId, ensureLineItems, createImportBatch, finalizeBatch]
  );

  return {
    importing,
    statusMessage,
    lastResult,
    importHistorical,
    importActuals,
  };
}

