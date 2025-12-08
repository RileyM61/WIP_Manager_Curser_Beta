import { useState, useCallback } from 'react';
import { Job, JobFinancialSnapshot, BillingPositionLabel } from '../types';
import { supabase, isSupabaseConfigured, dbSnapshotToAppSnapshot, appSnapshotToDbSnapshot } from '../lib/supabase';

/**
 * Result of creating a snapshot, includes the new snapshot and optionally the previous one for comparison.
 */
export interface CreateSnapshotResult {
    newSnapshot: JobFinancialSnapshot;
    previousSnapshot: JobFinancialSnapshot | null;
}

/**
 * Hook for managing job financial snapshots.
 * Provides functions to read history and create new snapshots.
 */
export function useJobFinancialSnapshots(companyId?: string | null) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Get the latest snapshot for a specific job
     */
    const getLatestSnapshot = useCallback(async (jobId: string): Promise<JobFinancialSnapshot | null> => {
        if (!isSupabaseConfigured() || !companyId) return null;

        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase!
                .from('job_financial_snapshots')
                .select('*')
                .eq('company_id', companyId)
                .eq('job_id', jobId)
                .order('snapshot_date', { ascending: false })
                .limit(1)
                .single();

            if (fetchError) {
                if (fetchError.code === 'PGRST116') {
                    // No rows returned - not an error, just no snapshots yet
                    return null;
                }
                throw fetchError;
            }

            return dbSnapshotToAppSnapshot(data);
        } catch (err: any) {
            console.error('Error getting latest snapshot:', err);
            setError(err.message || 'Failed to get snapshot');
            return null;
        } finally {
            setLoading(false);
        }
    }, [companyId]);

    /**
     * Get snapshot history for a job
     */
    const getSnapshotHistory = useCallback(async (
        jobId: string,
        limit: number = 10
    ): Promise<JobFinancialSnapshot[]> => {
        if (!isSupabaseConfigured() || !companyId) return [];

        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase!
                .from('job_financial_snapshots')
                .select('*')
                .eq('company_id', companyId)
                .eq('job_id', jobId)
                .order('snapshot_date', { ascending: false })
                .limit(limit);

            if (fetchError) throw fetchError;

            return (data || []).map(dbSnapshotToAppSnapshot);
        } catch (err: any) {
            console.error('Error getting snapshot history:', err);
            setError(err.message || 'Failed to get snapshot history');
            return [];
        } finally {
            setLoading(false);
        }
    }, [companyId]);



    /**
     * Create a financial snapshot from current job data.
     * Returns both the new snapshot and the previous snapshot (if any) for comparison.
     */
    const createSnapshotFromJob = useCallback(async (job: Job): Promise<CreateSnapshotResult | null> => {
        if (!isSupabaseConfigured() || !companyId) return null;

        try {
            setLoading(true);
            setError(null);

            // First, fetch the previous snapshot for comparison
            const previousSnapshot = await getLatestSnapshot(job.id);

            // Calculate financial metrics from job data
            const contractTotal = job.contract.labor + job.contract.material + job.contract.other;
            const budgetTotal = job.budget.labor + job.budget.material + job.budget.other;
            const costsTotal = job.costs.labor + job.costs.material + job.costs.other;
            const invoicedTotal = job.invoiced.labor + job.invoiced.material + job.invoiced.other;
            const costToCompleteTotal = job.costToComplete.labor + job.costToComplete.material + job.costToComplete.other;

            // Calculate earned revenue (percent complete * contract)
            const percentComplete = budgetTotal > 0 ? costsTotal / budgetTotal : 0;
            const earnedRevenue = contractTotal * Math.min(percentComplete, 1);

            // Forecasted values
            const forecastedCost = costsTotal + costToCompleteTotal;
            const forecastedRevenue = contractTotal; // Assuming fixed price
            const forecastedProfit = forecastedRevenue - forecastedCost;
            const forecastedMargin = forecastedRevenue > 0 ? forecastedProfit / forecastedRevenue : 0;

            // Original targets
            const originalProfit = job.targetProfit ?? (contractTotal - budgetTotal);
            const originalMargin = job.targetMargin ?? (contractTotal > 0 ? originalProfit / contractTotal : 0);

            // Billing position
            const billingPosition = invoicedTotal - earnedRevenue;
            let billingLabel: BillingPositionLabel;
            if (billingPosition > 0) {
                billingLabel = 'over-billed';
            } else if (billingPosition < 0) {
                billingLabel = 'under-billed';
            } else {
                billingLabel = 'on-track';
            }

            // Health flags
            const atRiskMargin = forecastedMargin < (originalMargin * 0.8); // Margin dropped more than 20%
            const behindSchedule = job.endDate && job.targetEndDate && job.endDate > job.targetEndDate;

            const snapshotData = {
                companyId,
                jobId: job.id,
                snapshotDate: new Date().toISOString(),
                contractAmount: contractTotal,
                originalBudgetTotal: budgetTotal,
                originalProfitTarget: originalProfit,
                originalMarginTarget: originalMargin,
                earnedToDate: earnedRevenue,
                invoicedToDate: invoicedTotal,
                costLaborToDate: job.costs.labor,
                costMaterialToDate: job.costs.material,
                costOtherToDate: job.costs.other,
                totalCostToDate: costsTotal,
                forecastedCostFinal: forecastedCost,
                forecastedRevenueFinal: forecastedRevenue,
                forecastedProfitFinal: forecastedProfit,
                forecastedMarginFinal: forecastedMargin,
                billingPositionNumeric: billingPosition,
                billingPositionLabel: billingLabel,
                atRiskMargin,
                behindSchedule: behindSchedule || false,
            };

            const dbSnapshot = appSnapshotToDbSnapshot(snapshotData as any);

            const { data, error: insertError } = await supabase!
                .from('job_financial_snapshots')
                .insert(dbSnapshot)
                .select()
                .single();

            if (insertError) throw insertError;

            const newSnapshot = dbSnapshotToAppSnapshot(data);
            return { newSnapshot, previousSnapshot };
        } catch (err: any) {
            console.error('Error creating snapshot:', err);
            setError(err.message || 'Failed to create snapshot');
            return null;
        } finally {
            setLoading(false);
        }
    }, [companyId, getLatestSnapshot]);

    /**
     * Create snapshots for all active jobs in the company
     */
    const createBulkSnapshots = useCallback(async (jobs: Job[]): Promise<number> => {
        if (!isSupabaseConfigured() || !companyId) return 0;

        try {
            setLoading(true);
            setError(null);

            let successCount = 0;

            // Filter to active jobs only
            const activeJobs = jobs.filter(j => j.status === 'Active');

            for (const job of activeJobs) {
                const result = await createSnapshotFromJob(job);
                if (result) successCount++;
            }

            return successCount;
        } catch (err: any) {
            console.error('Error creating bulk snapshots:', err);
            setError(err.message || 'Failed to create bulk snapshots');
            return 0;
        } finally {
            setLoading(false);
        }
    }, [companyId, createSnapshotFromJob]);

    return {
        loading,
        error,
        getLatestSnapshot,
        getSnapshotHistory,
        createSnapshotFromJob,
        createBulkSnapshots,
    };
}
