import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  ForecastLineItem,
  StatementType,
} from '../types';

interface DbForecastLineItem {
  id: string;
  company_id: string;
  statement_type: StatementType;
  line_code: string;
  line_name: string;
  line_category: string | null;
  line_subcategory: string | null;
  display_order: number;
  is_calculated: boolean;
  calculation_formula: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function mapLineItem(row: DbForecastLineItem): ForecastLineItem {
  return {
    id: row.id,
    companyId: row.company_id,
    statementType: row.statement_type,
    lineCode: row.line_code,
    lineName: row.line_name,
    lineCategory: row.line_category,
    lineSubcategory: row.line_subcategory,
    displayOrder: row.display_order,
    isCalculated: row.is_calculated,
    calculationFormula: row.calculation_formula,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useForecastLineItems(companyId: string | null) {
  const [lineItems, setLineItems] = useState<ForecastLineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLineItems = useCallback(async () => {
    if (!companyId) {
      setLineItems([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('forecast_line_items')
        .select('*')
        .eq('company_id', companyId)
        .order('statement_type')
        .order('display_order');

      if (fetchError) throw fetchError;

      setLineItems((data || []).map(mapLineItem));
    } catch (err: any) {
      console.error('[useForecastLineItems] fetch failed', err);
      setError(err.message || 'Failed to load forecast line items');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchLineItems();
  }, [fetchLineItems]);

  const upsertLineItems = useCallback(
    async (items: Omit<ForecastLineItem, 'id' | 'createdAt' | 'updatedAt'>[]) => {
      if (!companyId || items.length === 0) return [];

      setError(null);

      try {
        const payload = items.map((item, index) => ({
          company_id: companyId,
          statement_type: item.statementType,
          line_code: item.lineCode,
          line_name: item.lineName,
          line_category: item.lineCategory,
          line_subcategory: item.lineSubcategory,
          display_order: item.displayOrder ?? index,
          is_calculated: item.isCalculated ?? false,
          calculation_formula: item.calculationFormula,
          is_active: item.isActive ?? true,
        }));

        const { data, error: upsertError } = await supabase
          .from('forecast_line_items')
          .upsert(payload, {
            onConflict: 'company_id,statement_type,line_code',
            ignoreDuplicates: false,
          })
          .select();

        if (upsertError) throw upsertError;

        const mapped = (data || []).map(mapLineItem);
        setLineItems((prev) => {
          const existingMap = new Map(prev.map((item) => [item.id, item]));
          mapped.forEach((item) => existingMap.set(item.id, item));
          return Array.from(existingMap.values()).sort((a, b) => a.displayOrder - b.displayOrder);
        });

        return mapped;
      } catch (err: any) {
        console.error('[useForecastLineItems] upsert failed', err);
        setError(err.message || 'Failed to save line items');
        return [];
      }
    },
    [companyId]
  );

  const groupedByStatement = useMemo(() => {
    return lineItems.reduce<Record<StatementType, ForecastLineItem[]>>(
      (acc, item) => {
        acc[item.statementType] = acc[item.statementType] || [];
        acc[item.statementType].push(item);
        return acc;
      },
      { income_statement: [], balance_sheet: [] }
    );
  }, [lineItems]);

  return {
    lineItems,
    groupedByStatement,
    loading,
    error,
    refresh: fetchLineItems,
    upsertLineItems,
  };
}

