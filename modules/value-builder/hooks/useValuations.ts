/**
 * Hook for managing valuations (CRUD operations)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { Valuation, ValuationFormData } from '../types';
import { calculateAdjustedEbitda, calculateBusinessValue } from '../lib/calculations';

interface UseValuationsReturn {
  valuations: Valuation[];
  currentValuation: Valuation | null;
  loading: boolean;
  error: string | null;
  createValuation: (data: ValuationFormData) => Promise<Valuation | null>;
  updateValuation: (id: string, data: Partial<ValuationFormData>) => Promise<boolean>;
  deleteValuation: (id: string) => Promise<boolean>;
  setAsCurrent: (id: string) => Promise<boolean>;
  duplicateValuation: (id: string, newName: string) => Promise<Valuation | null>;
  refresh: () => Promise<void>;
}

// Map database row to app type
function dbToValuation(row: any): Valuation {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    isCurrent: row.is_current,
    annualRevenue: Number(row.annual_revenue) || 0,
    netProfit: Number(row.net_profit) || 0,
    ownerCompensation: Number(row.owner_compensation) || 0,
    depreciation: Number(row.depreciation) || 0,
    interestExpense: Number(row.interest_expense) || 0,
    taxes: Number(row.taxes) || 0,
    otherAddbacks: Number(row.other_addbacks) || 0,
    adjustedEbitda: Number(row.adjusted_ebitda) || 0,
    multiple: Number(row.multiple) || 3.0,
    businessValue: Number(row.business_value) || 0,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useValuations(companyId: string | undefined): UseValuationsReturn {
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all valuations for the company
  const fetchValuations = useCallback(async () => {
    if (!companyId) {
      setValuations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('valuations')
        .select('*')
        .eq('company_id', companyId)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      setValuations((data || []).map(dbToValuation));
    } catch (err: any) {
      console.error('[useValuations] Error fetching:', err);
      setError(err.message || 'Failed to fetch valuations');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchValuations();
  }, [fetchValuations]);

  // Get current valuation
  const currentValuation = valuations.find(v => v.isCurrent) || null;

  // Create new valuation
  const createValuation = useCallback(async (data: ValuationFormData): Promise<Valuation | null> => {
    if (!companyId) return null;

    try {
      const adjustedEbitda = calculateAdjustedEbitda({
        ...data,
        interestExpense: data.interestExpense,
      });
      const businessValue = calculateBusinessValue(adjustedEbitda, data.multiple);

      const { data: newRow, error: insertError } = await supabase
        .from('valuations')
        .insert([{
          company_id: companyId,
          name: data.name,
          is_current: data.isCurrent,
          annual_revenue: data.annualRevenue,
          net_profit: data.netProfit,
          owner_compensation: data.ownerCompensation,
          depreciation: data.depreciation,
          interest_expense: data.interestExpense,
          taxes: data.taxes,
          other_addbacks: data.otherAddbacks,
          adjusted_ebitda: adjustedEbitda,
          multiple: data.multiple,
          business_value: businessValue,
          notes: data.notes || null,
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      const newValuation = dbToValuation(newRow);
      
      // If this is set as current, update local state to reflect that
      if (data.isCurrent) {
        setValuations(prev => prev.map(v => ({ ...v, isCurrent: false })).concat(newValuation));
      } else {
        setValuations(prev => [newValuation, ...prev]);
      }

      return newValuation;
    } catch (err: any) {
      console.error('[useValuations] Error creating:', err);
      setError(err.message || 'Failed to create valuation');
      return null;
    }
  }, [companyId]);

  // Update valuation
  const updateValuation = useCallback(async (id: string, data: Partial<ValuationFormData>): Promise<boolean> => {
    try {
      // Find existing valuation to merge with updates
      const existing = valuations.find(v => v.id === id);
      if (!existing) return false;

      const merged = { ...existing, ...data };
      const adjustedEbitda = calculateAdjustedEbitda(merged);
      const businessValue = calculateBusinessValue(adjustedEbitda, merged.multiple);

      const updateData: any = {
        adjusted_ebitda: adjustedEbitda,
        business_value: businessValue,
      };

      // Only include fields that were provided
      if (data.name !== undefined) updateData.name = data.name;
      if (data.isCurrent !== undefined) updateData.is_current = data.isCurrent;
      if (data.annualRevenue !== undefined) updateData.annual_revenue = data.annualRevenue;
      if (data.netProfit !== undefined) updateData.net_profit = data.netProfit;
      if (data.ownerCompensation !== undefined) updateData.owner_compensation = data.ownerCompensation;
      if (data.depreciation !== undefined) updateData.depreciation = data.depreciation;
      if (data.interestExpense !== undefined) updateData.interest_expense = data.interestExpense;
      if (data.taxes !== undefined) updateData.taxes = data.taxes;
      if (data.otherAddbacks !== undefined) updateData.other_addbacks = data.otherAddbacks;
      if (data.multiple !== undefined) updateData.multiple = data.multiple;
      if (data.notes !== undefined) updateData.notes = data.notes || null;

      const { error: updateError } = await supabase
        .from('valuations')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      // Refresh to get latest state (handles is_current trigger)
      await fetchValuations();
      return true;
    } catch (err: any) {
      console.error('[useValuations] Error updating:', err);
      setError(err.message || 'Failed to update valuation');
      return false;
    }
  }, [valuations, fetchValuations]);

  // Delete valuation
  const deleteValuation = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('valuations')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setValuations(prev => prev.filter(v => v.id !== id));
      return true;
    } catch (err: any) {
      console.error('[useValuations] Error deleting:', err);
      setError(err.message || 'Failed to delete valuation');
      return false;
    }
  }, []);

  // Set a valuation as current
  const setAsCurrent = useCallback(async (id: string): Promise<boolean> => {
    return updateValuation(id, { isCurrent: true });
  }, [updateValuation]);

  // Duplicate a valuation
  const duplicateValuation = useCallback(async (id: string, newName: string): Promise<Valuation | null> => {
    const source = valuations.find(v => v.id === id);
    if (!source) return null;

    return createValuation({
      name: newName,
      annualRevenue: source.annualRevenue,
      netProfit: source.netProfit,
      ownerCompensation: source.ownerCompensation,
      depreciation: source.depreciation,
      interestExpense: source.interestExpense,
      taxes: source.taxes,
      otherAddbacks: source.otherAddbacks,
      multiple: source.multiple,
      notes: source.notes || '',
      isCurrent: false,
    });
  }, [valuations, createValuation]);

  return {
    valuations,
    currentValuation,
    loading,
    error,
    createValuation,
    updateValuation,
    deleteValuation,
    setAsCurrent,
    duplicateValuation,
    refresh: fetchValuations,
  };
}

