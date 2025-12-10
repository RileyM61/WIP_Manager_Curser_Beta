import { useState, useCallback } from 'react';
import { ChangeOrder, ChangeOrderStatus, CostBreakdown, JobType, TMSettings } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Transform Supabase change_order row to app ChangeOrder type
 */
export function dbChangeOrderToApp(dbCO: any): ChangeOrder {
    // Parse tm_settings from JSONB
    let tmSettings: TMSettings | undefined;
    if (dbCO.tm_settings) {
        const tm = typeof dbCO.tm_settings === 'string'
            ? JSON.parse(dbCO.tm_settings)
            : dbCO.tm_settings;
        tmSettings = {
            laborBillingType: tm.laborBillingType || 'markup',
            laborBillRate: tm.laborBillRate,
            laborHours: tm.laborHours,
            laborMarkup: tm.laborMarkup,
            materialMarkup: tm.materialMarkup || 1,
            otherMarkup: tm.otherMarkup || 1,
        };
    }

    return {
        id: dbCO.id,
        jobId: dbCO.job_id,
        companyId: dbCO.company_id,
        coNumber: dbCO.co_number,
        description: dbCO.description || '',
        coType: (dbCO.co_type as JobType) || 'fixed-price',
        status: (dbCO.status as ChangeOrderStatus) || 'pending',

        contract: {
            labor: Number(dbCO.contract_labor) || 0,
            material: Number(dbCO.contract_material) || 0,
            other: Number(dbCO.contract_other) || 0,
        },
        budget: {
            labor: Number(dbCO.budget_labor) || 0,
            material: Number(dbCO.budget_material) || 0,
            other: Number(dbCO.budget_other) || 0,
        },
        costs: {
            labor: Number(dbCO.costs_labor) || 0,
            material: Number(dbCO.costs_material) || 0,
            other: Number(dbCO.costs_other) || 0,
        },
        invoiced: {
            labor: Number(dbCO.invoiced_labor) || 0,
            material: Number(dbCO.invoiced_material) || 0,
            other: Number(dbCO.invoiced_other) || 0,
        },
        costToComplete: {
            labor: Number(dbCO.cost_to_complete_labor) || 0,
            material: Number(dbCO.cost_to_complete_material) || 0,
            other: Number(dbCO.cost_to_complete_other) || 0,
        },

        tmSettings,

        submittedDate: dbCO.submitted_date || undefined,
        approvedDate: dbCO.approved_date || undefined,
        completedDate: dbCO.completed_date || undefined,
        createdAt: dbCO.created_at || undefined,
        updatedAt: dbCO.updated_at || undefined,
        createdBy: dbCO.created_by || undefined,
    };
}

/**
 * Transform app ChangeOrder to Supabase insert/update format
 */
export function appChangeOrderToDb(co: ChangeOrder): any {
    // Prepare tm_settings for JSONB storage
    const tmSettings = co.tmSettings ? {
        laborBillingType: co.tmSettings.laborBillingType,
        laborBillRate: co.tmSettings.laborBillRate,
        laborHours: co.tmSettings.laborHours,
        laborMarkup: co.tmSettings.laborMarkup,
        materialMarkup: co.tmSettings.materialMarkup,
        otherMarkup: co.tmSettings.otherMarkup,
    } : null;

    return {
        job_id: co.jobId,
        company_id: co.companyId,
        co_number: co.coNumber,
        description: co.description,
        co_type: co.coType,
        status: co.status,

        contract_labor: co.contract.labor,
        contract_material: co.contract.material,
        contract_other: co.contract.other,

        budget_labor: co.budget.labor,
        budget_material: co.budget.material,
        budget_other: co.budget.other,

        costs_labor: co.costs.labor,
        costs_material: co.costs.material,
        costs_other: co.costs.other,

        invoiced_labor: co.invoiced.labor,
        invoiced_material: co.invoiced.material,
        invoiced_other: co.invoiced.other,

        cost_to_complete_labor: co.costToComplete.labor,
        cost_to_complete_material: co.costToComplete.material,
        cost_to_complete_other: co.costToComplete.other,

        tm_settings: tmSettings,

        submitted_date: co.submittedDate || null,
        approved_date: co.approvedDate || null,
        completed_date: co.completedDate || null,
    };
}

/**
 * Hook for managing change orders for a specific job
 */
export function useSupabaseChangeOrders(companyId?: string | null) {
    const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Load all change orders for a specific job
     */
    const loadChangeOrders = useCallback(async (jobId: string) => {
        if (!companyId || !jobId) {
            setChangeOrders([]);
            setError(null);
            return;
        }
        if (!isSupabaseConfigured()) {
            setError('Supabase not configured');
            return;
        }

        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase!
                .from('change_orders')
                .select('*')
                .eq('job_id', jobId)
                .eq('company_id', companyId)
                .order('co_number', { ascending: true });

            if (fetchError) throw fetchError;

            const appCOs = (data || []).map(dbChangeOrderToApp);
            setChangeOrders(appCOs);
            setError(null);
        } catch (err: any) {
            console.error('Error loading change orders:', err);
            setError(err.message || 'Failed to load change orders');
        } finally {
            setLoading(false);
        }
    }, [companyId]);

    /**
     * Get the next CO number for a job
     */
    const getNextCoNumber = useCallback(async (jobId: string): Promise<number> => {
        if (!isSupabaseConfigured() || !companyId) return 1;

        try {
            const { data, error: fetchError } = await supabase!
                .from('change_orders')
                .select('co_number')
                .eq('job_id', jobId)
                .eq('company_id', companyId)
                .order('co_number', { ascending: false })
                .limit(1);

            if (fetchError) throw fetchError;

            return data && data.length > 0 ? data[0].co_number + 1 : 1;
        } catch (err) {
            console.error('Error getting next CO number:', err);
            return 1;
        }
    }, [companyId]);

    /**
     * Add a new change order
     */
    const addChangeOrder = useCallback(async (co: Omit<ChangeOrder, 'id' | 'coNumber' | 'createdAt' | 'updatedAt'>, jobId: string): Promise<ChangeOrder | null> => {
        if (!isSupabaseConfigured() || !companyId) return null;

        try {
            const nextNumber = await getNextCoNumber(jobId);
            const newCO: ChangeOrder = {
                ...co,
                id: '', // Will be generated by DB
                coNumber: nextNumber,
                jobId,
                companyId,
            } as ChangeOrder;

            const dbCO = { ...appChangeOrderToDb(newCO), company_id: companyId };
            delete dbCO.id; // Let DB generate

            const { data, error: insertError } = await supabase!
                .from('change_orders')
                .insert(dbCO)
                .select()
                .single();

            if (insertError) throw insertError;

            const createdCO = dbChangeOrderToApp(data);
            setChangeOrders(prev => [...prev, createdCO]);
            return createdCO;
        } catch (err: any) {
            console.error('Error adding change order:', err);
            throw err;
        }
    }, [companyId, getNextCoNumber]);

    /**
     * Update an existing change order
     */
    const updateChangeOrder = useCallback(async (co: ChangeOrder): Promise<ChangeOrder | null> => {
        if (!isSupabaseConfigured() || !companyId) return null;

        try {
            const dbCO = appChangeOrderToDb(co);
            const { data, error: updateError } = await supabase!
                .from('change_orders')
                .update({ ...dbCO, updated_at: new Date().toISOString() })
                .eq('id', co.id)
                .eq('company_id', companyId)
                .select()
                .single();

            if (updateError) throw updateError;

            const updatedCO = dbChangeOrderToApp(data);
            setChangeOrders(prev => prev.map(c => c.id === updatedCO.id ? updatedCO : c));
            return updatedCO;
        } catch (err: any) {
            console.error('Error updating change order:', err);
            throw err;
        }
    }, [companyId]);

    /**
     * Delete a change order
     */
    const deleteChangeOrder = useCallback(async (coId: string): Promise<void> => {
        if (!isSupabaseConfigured() || !companyId) return;

        try {
            const { error: deleteError } = await supabase!
                .from('change_orders')
                .delete()
                .eq('id', coId)
                .eq('company_id', companyId);

            if (deleteError) throw deleteError;

            setChangeOrders(prev => prev.filter(c => c.id !== coId));
        } catch (err: any) {
            console.error('Error deleting change order:', err);
            throw err;
        }
    }, [companyId]);

    return {
        changeOrders,
        loading,
        error,
        loadChangeOrders,
        addChangeOrder,
        updateChangeOrder,
        deleteChangeOrder,
        getNextCoNumber,
    };
}

// ============================================================================
// Change Order Calculation Helpers
// ============================================================================

/**
 * Sum a CostBreakdown to get total
 */
function sumBreakdown(breakdown: CostBreakdown): number {
    return breakdown.labor + breakdown.material + breakdown.other;
}

/**
 * Sum approved change orders' contract values
 */
export function sumApprovedCOsContract(changeOrders: ChangeOrder[]): CostBreakdown {
    const approved = changeOrders.filter(co => co.status === 'approved' || co.status === 'completed');
    return {
        labor: approved.reduce((sum, co) => sum + co.contract.labor, 0),
        material: approved.reduce((sum, co) => sum + co.contract.material, 0),
        other: approved.reduce((sum, co) => sum + co.contract.other, 0),
    };
}

/**
 * Sum approved change orders' costs
 */
export function sumApprovedCOsCosts(changeOrders: ChangeOrder[]): CostBreakdown {
    const approved = changeOrders.filter(co => co.status === 'approved' || co.status === 'completed');
    return {
        labor: approved.reduce((sum, co) => sum + co.costs.labor, 0),
        material: approved.reduce((sum, co) => sum + co.costs.material, 0),
        other: approved.reduce((sum, co) => sum + co.costs.other, 0),
    };
}

/**
 * Sum approved change orders' budgets
 */
export function sumApprovedCOsBudget(changeOrders: ChangeOrder[]): CostBreakdown {
    const approved = changeOrders.filter(co => co.status === 'approved' || co.status === 'completed');
    return {
        labor: approved.reduce((sum, co) => sum + co.budget.labor, 0),
        material: approved.reduce((sum, co) => sum + co.budget.material, 0),
        other: approved.reduce((sum, co) => sum + co.budget.other, 0),
    };
}

/**
 * Get pending change orders' total contract value
 */
export function getPendingCOsContractTotal(changeOrders: ChangeOrder[]): number {
    const pending = changeOrders.filter(co => co.status === 'pending');
    return pending.reduce((sum, co) => sum + sumBreakdown(co.contract), 0);
}

/**
 * Get the total contract value including approved COs
 */
export function getJobTotalContract(originalContract: CostBreakdown, changeOrders: ChangeOrder[]): CostBreakdown {
    const approvedCOs = sumApprovedCOsContract(changeOrders);
    return {
        labor: originalContract.labor + approvedCOs.labor,
        material: originalContract.material + approvedCOs.material,
        other: originalContract.other + approvedCOs.other,
    };
}

/**
 * Count change orders by status
 */
export function countCOsByStatus(changeOrders: ChangeOrder[]): Record<ChangeOrderStatus, number> {
    return {
        pending: changeOrders.filter(co => co.status === 'pending').length,
        approved: changeOrders.filter(co => co.status === 'approved').length,
        rejected: changeOrders.filter(co => co.status === 'rejected').length,
        completed: changeOrders.filter(co => co.status === 'completed').length,
    };
}

// ============================================================================
// Change Order Counts Hook (for job card badges)
// ============================================================================

export interface COCountByJob {
    jobId: string;
    total: number;
    pending: number;
    approved: number;
}

/**
 * Hook for fetching CO counts for multiple jobs (efficient for job card display)
 */
export function useChangeOrderCounts(companyId?: string | null) {
    const [coCounts, setCoCounts] = useState<Record<string, COCountByJob>>({});
    const [loading, setLoading] = useState(false);

    /**
     * Load CO counts for all jobs in the company
     */
    const loadCOCounts = useCallback(async () => {
        if (!companyId || !isSupabaseConfigured()) {
            setCoCounts({});
            return;
        }

        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase!
                .from('change_orders')
                .select('job_id, status')
                .eq('company_id', companyId);

            if (fetchError) throw fetchError;

            // Aggregate counts by job
            const counts: Record<string, COCountByJob> = {};
            (data || []).forEach((co: { job_id: string; status: string }) => {
                if (!counts[co.job_id]) {
                    counts[co.job_id] = { jobId: co.job_id, total: 0, pending: 0, approved: 0 };
                }
                counts[co.job_id].total++;
                if (co.status === 'pending') {
                    counts[co.job_id].pending++;
                } else if (co.status === 'approved' || co.status === 'completed') {
                    counts[co.job_id].approved++;
                }
            });

            setCoCounts(counts);
        } catch (err) {
            console.error('Error loading CO counts:', err);
        } finally {
            setLoading(false);
        }
    }, [companyId]);

    return {
        coCounts,
        loading,
        loadCOCounts,
        getCountForJob: (jobId: string) => coCounts[jobId] || { jobId, total: 0, pending: 0, approved: 0 },
    };
}

