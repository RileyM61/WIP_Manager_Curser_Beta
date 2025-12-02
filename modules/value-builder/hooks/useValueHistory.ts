/**
 * Hook for managing value history (tracking over time)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { ValueHistoryRecord, Valuation } from '../types';
import { calculateValueGrowth } from '../lib/calculations';

interface UseValueHistoryReturn {
  history: ValueHistoryRecord[];
  loading: boolean;
  error: string | null;
  recordValue: (valuation: Valuation) => Promise<boolean>;
  deleteRecord: (id: string) => Promise<boolean>;
  valueGrowth: { amount: number; percent: number; period: string } | null;
  refresh: () => Promise<void>;
}

// Map database row to app type
function dbToHistoryRecord(row: any): ValueHistoryRecord {
  return {
    id: row.id,
    companyId: row.company_id,
    valuationId: row.valuation_id,
    recordedAt: row.recorded_at,
    adjustedEbitda: Number(row.adjusted_ebitda) || 0,
    multiple: Number(row.multiple) || 3.0,
    businessValue: Number(row.business_value) || 0,
    createdAt: row.created_at,
  };
}

export function useValueHistory(companyId: string | undefined): UseValueHistoryReturn {
  const [history, setHistory] = useState<ValueHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch history records
  const fetchHistory = useCallback(async () => {
    if (!companyId) {
      setHistory([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('value_history')
        .select('*')
        .eq('company_id', companyId)
        .order('recorded_at', { ascending: false });

      if (fetchError) throw fetchError;

      setHistory((data || []).map(dbToHistoryRecord));
    } catch (err: any) {
      console.error('[useValueHistory] Error fetching:', err);
      setError(err.message || 'Failed to fetch value history');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Record current value (upsert for today's date)
  const recordValue = useCallback(async (valuation: Valuation): Promise<boolean> => {
    if (!companyId) return false;

    try {
      const today = new Date().toISOString().split('T')[0];

      const { error: upsertError } = await supabase
        .from('value_history')
        .upsert({
          company_id: companyId,
          valuation_id: valuation.id,
          recorded_at: today,
          adjusted_ebitda: valuation.adjustedEbitda,
          multiple: valuation.multiple,
          business_value: valuation.businessValue,
        }, {
          onConflict: 'company_id,recorded_at',
        });

      if (upsertError) throw upsertError;

      await fetchHistory();
      return true;
    } catch (err: any) {
      console.error('[useValueHistory] Error recording:', err);
      setError(err.message || 'Failed to record value');
      return false;
    }
  }, [companyId, fetchHistory]);

  // Delete a history record
  const deleteRecord = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('value_history')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setHistory(prev => prev.filter(h => h.id !== id));
      return true;
    } catch (err: any) {
      console.error('[useValueHistory] Error deleting:', err);
      setError(err.message || 'Failed to delete record');
      return false;
    }
  }, []);

  // Calculate value growth from history
  const valueGrowth = calculateValueGrowth(history, 12);

  return {
    history,
    loading,
    error,
    recordValue,
    deleteRecord,
    valueGrowth,
    refresh: fetchHistory,
  };
}

