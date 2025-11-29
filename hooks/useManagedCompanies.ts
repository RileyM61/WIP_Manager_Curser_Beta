import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import { ManagedCompany, ModuleId } from '../types';
import { dbManagedCompanyToApp } from '../lib/supabase/helpers';

interface UseManagedCompaniesReturn {
  managedCompanies: ManagedCompany[];
  loading: boolean;
  error: string | null;
  refreshManagedCompanies: () => Promise<void>;
  createManagedCompany: (
    companyName: string,
    practiceName: string,
    grantedModules: ModuleId[],
    ownerEmail?: string
  ) => Promise<{ success: boolean; companyId?: string; error?: string }>;
  updateGrantedModules: (
    companyId: string,
    modules: ModuleId[]
  ) => Promise<{ success: boolean; error?: string }>;
}

/**
 * Hook for CFO users to manage their client companies
 * 
 * @param cfoUserId - The CFO's user ID
 * @param cfoCompanyId - The CFO's company ID
 */
export function useManagedCompanies(
  cfoUserId: string | null,
  cfoCompanyId: string | null
): UseManagedCompaniesReturn {
  const [managedCompanies, setManagedCompanies] = useState<ManagedCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchManagedCompanies = useCallback(async () => {
    if (!cfoUserId) {
      setManagedCompanies([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .rpc('get_managed_companies', { cfo_user_id: cfoUserId });

      if (fetchError) {
        console.error('Error fetching managed companies:', fetchError);
        setError(fetchError.message);
        setManagedCompanies([]);
      } else {
        const companies = (data || []).map(dbManagedCompanyToApp);
        setManagedCompanies(companies);
      }
    } catch (err) {
      console.error('Error in fetchManagedCompanies:', err);
      setError('Failed to fetch managed companies');
      setManagedCompanies([]);
    } finally {
      setLoading(false);
    }
  }, [cfoUserId]);

  useEffect(() => {
    fetchManagedCompanies();
  }, [fetchManagedCompanies]);

  const createManagedCompany = useCallback(async (
    companyName: string,
    practiceName: string,
    grantedModules: ModuleId[],
    ownerEmail?: string
  ): Promise<{ success: boolean; companyId?: string; error?: string }> => {
    if (!cfoUserId || !cfoCompanyId) {
      return { success: false, error: 'Not authenticated as CFO' };
    }

    try {
      const { data, error: createError } = await supabase
        .rpc('create_managed_company', {
          p_company_name: companyName,
          p_cfo_user_id: cfoUserId,
          p_cfo_company_id: cfoCompanyId,
          p_practice_name: practiceName,
          p_granted_modules: grantedModules,
          p_owner_email: ownerEmail || null,
        });

      if (createError) {
        console.error('Error creating managed company:', createError);
        return { success: false, error: createError.message };
      }

      // Refresh the list
      await fetchManagedCompanies();

      return { success: true, companyId: data };
    } catch (err) {
      console.error('Error in createManagedCompany:', err);
      return { success: false, error: 'Failed to create company' };
    }
  }, [cfoUserId, cfoCompanyId, fetchManagedCompanies]);

  const updateGrantedModules = useCallback(async (
    companyId: string,
    modules: ModuleId[]
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error: updateError } = await supabase
        .from('settings')
        .update({ granted_modules: modules })
        .eq('company_id', companyId);

      if (updateError) {
        console.error('Error updating granted modules:', updateError);
        return { success: false, error: updateError.message };
      }

      // Refresh the list
      await fetchManagedCompanies();

      return { success: true };
    } catch (err) {
      console.error('Error in updateGrantedModules:', err);
      return { success: false, error: 'Failed to update modules' };
    }
  }, [fetchManagedCompanies]);

  return {
    managedCompanies,
    loading,
    error,
    refreshManagedCompanies: fetchManagedCompanies,
    createManagedCompany,
    updateGrantedModules,
  };
}

export default useManagedCompanies;

