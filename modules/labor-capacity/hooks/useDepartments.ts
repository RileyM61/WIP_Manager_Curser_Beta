// ============================================================================
// USE DEPARTMENTS HOOK
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { Department, DbDepartment, DepartmentFormData } from '../types';
import { DEFAULT_DEPARTMENTS } from '../constants';

// Transform database row to app type
function dbToDepartment(row: DbDepartment): Department {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    isProductive: row.is_productive,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useDepartments(companyId: string | null) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch departments
  const fetchDepartments = useCallback(async () => {
    if (!companyId || !supabase) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('departments')
        .select('*')
        .eq('company_id', companyId)
        .order('sort_order');

      if (fetchError) throw fetchError;

      setDepartments((data || []).map(dbToDepartment));
    } catch (err: any) {
      console.error('[useDepartments] Error fetching:', err);
      setError(err.message || 'Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  // Create department
  const createDepartment = useCallback(async (formData: DepartmentFormData): Promise<Department | null> => {
    if (!companyId || !supabase) return null;

    try {
      const { data, error: insertError } = await supabase
        .from('departments')
        .insert({
          company_id: companyId,
          name: formData.name,
          is_productive: formData.isProductive,
          sort_order: formData.sortOrder,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const newDept = dbToDepartment(data);
      setDepartments(prev => [...prev, newDept].sort((a, b) => a.sortOrder - b.sortOrder));
      return newDept;
    } catch (err: any) {
      console.error('[useDepartments] Error creating:', err);
      setError(err.message || 'Failed to create department');
      return null;
    }
  }, [companyId]);

  // Update department
  const updateDepartment = useCallback(async (id: string, formData: Partial<DepartmentFormData>): Promise<boolean> => {
    if (!supabase) return false;

    try {
      const updateData: Partial<DbDepartment> = {};
      if (formData.name !== undefined) updateData.name = formData.name;
      if (formData.isProductive !== undefined) updateData.is_productive = formData.isProductive;
      if (formData.sortOrder !== undefined) updateData.sort_order = formData.sortOrder;

      const { data, error: updateError } = await supabase
        .from('departments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      const updated = dbToDepartment(data);
      setDepartments(prev => 
        prev.map(d => d.id === id ? updated : d).sort((a, b) => a.sortOrder - b.sortOrder)
      );
      return true;
    } catch (err: any) {
      console.error('[useDepartments] Error updating:', err);
      setError(err.message || 'Failed to update department');
      return false;
    }
  }, []);

  // Delete department
  const deleteDepartment = useCallback(async (id: string): Promise<boolean> => {
    if (!supabase) return false;

    try {
      const { error: deleteError } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setDepartments(prev => prev.filter(d => d.id !== id));
      return true;
    } catch (err: any) {
      console.error('[useDepartments] Error deleting:', err);
      setError(err.message || 'Failed to delete department');
      return false;
    }
  }, []);

  // Initialize default departments
  const initializeDefaults = useCallback(async (): Promise<boolean> => {
    if (!companyId || !supabase) return false;

    try {
      const { data: existing } = await supabase
        .from('departments')
        .select('id')
        .eq('company_id', companyId)
        .limit(1);

      // Only initialize if no departments exist
      if (existing && existing.length > 0) {
        return true;
      }

      const { error: insertError } = await supabase
        .from('departments')
        .insert(
          DEFAULT_DEPARTMENTS.map(d => ({
            company_id: companyId,
            name: d.name,
            is_productive: d.isProductive,
            sort_order: d.sortOrder,
          }))
        );

      if (insertError) throw insertError;

      await fetchDepartments();
      return true;
    } catch (err: any) {
      console.error('[useDepartments] Error initializing defaults:', err);
      setError(err.message || 'Failed to initialize departments');
      return false;
    }
  }, [companyId, fetchDepartments]);

  // Reorder departments
  const reorderDepartments = useCallback(async (orderedIds: string[]): Promise<boolean> => {
    if (!supabase) return false;

    try {
      // Update sort_order for each department
      await Promise.all(
        orderedIds.map((id, index) =>
          supabase
            .from('departments')
            .update({ sort_order: index })
            .eq('id', id)
        )
      );

      setDepartments(prev => {
        const sorted = [...prev].sort(
          (a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id)
        );
        return sorted.map((d, i) => ({ ...d, sortOrder: i }));
      });
      return true;
    } catch (err: any) {
      console.error('[useDepartments] Error reordering:', err);
      setError(err.message || 'Failed to reorder departments');
      return false;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  return {
    departments,
    loading,
    error,
    refresh: fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    initializeDefaults,
    reorderDepartments,
  };
}

