import { useState, useEffect, useCallback } from 'react';
import { Job, JobStatus } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { calculateEarnedRevenue, sumBreakdown, calculateBillingDifference } from '../lib/jobCalculations';

// ============================================================================
// Types
// ============================================================================

export interface WeeklySnapshot {
  id: string;
  companyId: string;
  weekStart: string;
  weekEnd: string;
  weekNumber: number;
  year: number;
  totalEarnedRevenue: number;
  totalContractValue: number;
  totalCostsToDate: number;
  totalInvoiced: number;
  activeJobCount: number;
  snapshotData: Job[];
  createdAt: string;
}

export interface MonthlySnapshot {
  id: string;
  companyId: string;
  month: number;
  year: number;
  monthStart: string;
  monthEnd: string;
  totalEarnedRevenue: number;
  totalContractValue: number;
  totalCostsToDate: number;
  totalInvoiced: number;
  totalOverBilling: number;
  totalUnderBilling: number;
  activeJobCount: number;
  completedJobCount: number;
  snapshotData: Job[];
  createdAt: string;
  finalizedAt: string | null;
}

export interface WeeklyReportData {
  weekStart: string;
  weekEnd: string;
  weekNumber: number;
  year: number;
  totalEarnedRevenue: number;
  earnedRevenueChange: number;
  earnedRevenueChangePercent: number;
  jobBreakdown: Array<{
    jobId: string;
    jobNo: string;
    jobName: string;
    client: string;
    projectManager: string;
    earnedRevenue: number;
    previousEarnedRevenue: number;
    change: number;
  }>;
}

export interface MonthEndReportData {
  month: number;
  year: number;
  monthName: string;
  totalEarnedRevenue: number;
  totalContractValue: number;
  totalCostsToDate: number;
  totalInvoiced: number;
  totalOverBilling: number;
  totalUnderBilling: number;
  netBillingPosition: number;
  jobs: Array<{
    jobId: string;
    jobNo: string;
    jobName: string;
    client: string;
    projectManager: string;
    status: JobStatus;
    contractValue: number;
    costsToDate: number;
    percentComplete: number;
    earnedRevenue: number;
    invoiced: number;
    overUnderBilling: number;
    isOverBilled: boolean;
    forecastedProfit: number;
    profitMargin: number;
  }>;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get ISO week info for a given date
 */
export const getWeekInfo = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  
  // Set to nearest Thursday (ISO week starts Monday, week 1 contains Jan 4)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  
  // Get week start (Monday) and end (Sunday)
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
  weekStart.setDate(diff);
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  return {
    weekNumber,
    year: d.getFullYear(),
    weekStart: weekStart.toISOString().split('T')[0],
    weekEnd: weekEnd.toISOString().split('T')[0],
  };
};

/**
 * Get month info for a given date
 */
export const getMonthInfo = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0); // Last day of month
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return {
    month,
    year,
    monthName: monthNames[month - 1],
    monthStart: monthStart.toISOString().split('T')[0],
    monthEnd: monthEnd.toISOString().split('T')[0],
  };
};

/**
 * Filter jobs by their asOfDate to get jobs effective for a specific period
 * If a job has no asOfDate, uses lastUpdated or falls back to including it
 */
export const filterJobsByPeriod = (
  jobs: Job[],
  periodStart: Date,
  periodEnd: Date
): Job[] => {
  return jobs.filter(job => {
    // Use asOfDate if available, otherwise fall back to lastUpdated
    const effectiveDate = job.asOfDate 
      ? new Date(job.asOfDate)
      : job.lastUpdated 
        ? new Date(job.lastUpdated)
        : new Date(); // If neither exists, assume current
    
    return effectiveDate >= periodStart && effectiveDate <= periodEnd;
  });
};

/**
 * Get the effective date for a job (asOfDate or lastUpdated)
 */
export const getJobEffectiveDate = (job: Job): Date => {
  if (job.asOfDate) {
    return new Date(job.asOfDate);
  }
  if (job.lastUpdated) {
    return new Date(job.lastUpdated);
  }
  return new Date();
};

/**
 * Calculate aggregate metrics for a set of jobs
 */
const calculateJobMetrics = (jobs: Job[]) => {
  let totalEarnedRevenue = 0;
  let totalContractValue = 0;
  let totalCostsToDate = 0;
  let totalInvoiced = 0;
  let totalOverBilling = 0;
  let totalUnderBilling = 0;
  
  jobs.forEach(job => {
    const earned = calculateEarnedRevenue(job);
    const billing = calculateBillingDifference(job);
    
    totalEarnedRevenue += earned.total;
    totalContractValue += sumBreakdown(job.contract);
    totalCostsToDate += sumBreakdown(job.costs);
    totalInvoiced += sumBreakdown(job.invoiced);
    
    if (billing.isOverBilled) {
      totalOverBilling += billing.difference;
    } else {
      totalUnderBilling += Math.abs(billing.difference);
    }
  });
  
  return {
    totalEarnedRevenue,
    totalContractValue,
    totalCostsToDate,
    totalInvoiced,
    totalOverBilling,
    totalUnderBilling,
  };
};

// ============================================================================
// Hook: useWeeklySnapshots
// ============================================================================

export function useWeeklySnapshots(companyId?: string | null) {
  const [weeklySnapshots, setWeeklySnapshots] = useState<WeeklySnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load the last N weeks of snapshots
   */
  const loadWeeklySnapshots = useCallback(async (weeks: number = 5) => {
    if (!companyId || !isSupabaseConfigured()) {
      setWeeklySnapshots([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase!
        .from('weekly_snapshots')
        .select('*')
        .eq('company_id', companyId)
        .order('week_start', { ascending: false })
        .limit(weeks);

      if (fetchError) throw fetchError;

      const snapshots: WeeklySnapshot[] = (data || []).map(row => ({
        id: row.id,
        companyId: row.company_id,
        weekStart: row.week_start,
        weekEnd: row.week_end,
        weekNumber: row.week_number,
        year: row.year,
        totalEarnedRevenue: parseFloat(row.total_earned_revenue) || 0,
        totalContractValue: parseFloat(row.total_contract_value) || 0,
        totalCostsToDate: parseFloat(row.total_costs_to_date) || 0,
        totalInvoiced: parseFloat(row.total_invoiced) || 0,
        activeJobCount: row.active_job_count,
        snapshotData: row.snapshot_data || [],
        createdAt: row.created_at,
      }));

      setWeeklySnapshots(snapshots);
      setError(null);
    } catch (err: any) {
      console.error('Error loading weekly snapshots:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  /**
   * Create a weekly snapshot from current job data
   */
  const createWeeklySnapshot = useCallback(async (jobs: Job[]) => {
    if (!companyId || !isSupabaseConfigured()) return null;

    const activeJobs = jobs.filter(j => j.status === JobStatus.Active);
    const weekInfo = getWeekInfo(new Date());
    const metrics = calculateJobMetrics(activeJobs);

    try {
      const { data, error: insertError } = await supabase!
        .from('weekly_snapshots')
        .upsert({
          company_id: companyId,
          week_start: weekInfo.weekStart,
          week_end: weekInfo.weekEnd,
          week_number: weekInfo.weekNumber,
          year: weekInfo.year,
          total_earned_revenue: metrics.totalEarnedRevenue,
          total_contract_value: metrics.totalContractValue,
          total_costs_to_date: metrics.totalCostsToDate,
          total_invoiced: metrics.totalInvoiced,
          active_job_count: activeJobs.length,
          snapshot_data: activeJobs,
        }, {
          onConflict: 'company_id,year,week_number',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Reload snapshots
      await loadWeeklySnapshots();
      
      return data;
    } catch (err: any) {
      console.error('Error creating weekly snapshot:', err);
      throw err;
    }
  }, [companyId, loadWeeklySnapshots]);

  /**
   * Generate weekly report data with comparisons
   */
  const generateWeeklyReport = useCallback((weeks: number = 5): WeeklyReportData[] => {
    const report: WeeklyReportData[] = [];
    
    for (let i = 0; i < Math.min(weeks, weeklySnapshots.length); i++) {
      const current = weeklySnapshots[i];
      const previous = weeklySnapshots[i + 1];
      
      const previousEarnedRevenue = previous?.totalEarnedRevenue || 0;
      const earnedRevenueChange = current.totalEarnedRevenue - previousEarnedRevenue;
      const earnedRevenueChangePercent = previousEarnedRevenue > 0 
        ? (earnedRevenueChange / previousEarnedRevenue) * 100 
        : 0;
      
      // Build job breakdown with comparisons
      const jobBreakdown = current.snapshotData.map(job => {
        const currentEarned = calculateEarnedRevenue(job).total;
        
        // Find same job in previous snapshot
        const prevJob = previous?.snapshotData.find(j => j.id === job.id);
        const previousEarned = prevJob ? calculateEarnedRevenue(prevJob).total : 0;
        
        return {
          jobId: job.id,
          jobNo: job.jobNo,
          jobName: job.jobName,
          client: job.client,
          projectManager: job.projectManager,
          earnedRevenue: currentEarned,
          previousEarnedRevenue: previousEarned,
          change: currentEarned - previousEarned,
        };
      }).sort((a, b) => b.change - a.change); // Sort by change descending
      
      report.push({
        weekStart: current.weekStart,
        weekEnd: current.weekEnd,
        weekNumber: current.weekNumber,
        year: current.year,
        totalEarnedRevenue: current.totalEarnedRevenue,
        earnedRevenueChange,
        earnedRevenueChangePercent,
        jobBreakdown,
      });
    }
    
    return report;
  }, [weeklySnapshots]);

  // Load snapshots on mount
  useEffect(() => {
    loadWeeklySnapshots();
  }, [loadWeeklySnapshots]);

  return {
    weeklySnapshots,
    loading,
    error,
    loadWeeklySnapshots,
    createWeeklySnapshot,
    generateWeeklyReport,
  };
}

// ============================================================================
// Hook: useMonthlySnapshots
// ============================================================================

export function useMonthlySnapshots(companyId?: string | null) {
  const [monthlySnapshots, setMonthlySnapshots] = useState<MonthlySnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load monthly snapshots
   */
  const loadMonthlySnapshots = useCallback(async (months: number = 12) => {
    if (!companyId || !isSupabaseConfigured()) {
      setMonthlySnapshots([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase!
        .from('monthly_snapshots')
        .select('*')
        .eq('company_id', companyId)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(months);

      if (fetchError) throw fetchError;

      const snapshots: MonthlySnapshot[] = (data || []).map(row => ({
        id: row.id,
        companyId: row.company_id,
        month: row.month,
        year: row.year,
        monthStart: row.month_start,
        monthEnd: row.month_end,
        totalEarnedRevenue: parseFloat(row.total_earned_revenue) || 0,
        totalContractValue: parseFloat(row.total_contract_value) || 0,
        totalCostsToDate: parseFloat(row.total_costs_to_date) || 0,
        totalInvoiced: parseFloat(row.total_invoiced) || 0,
        totalOverBilling: parseFloat(row.total_over_billing) || 0,
        totalUnderBilling: parseFloat(row.total_under_billing) || 0,
        activeJobCount: row.active_job_count,
        completedJobCount: row.completed_job_count,
        snapshotData: row.snapshot_data || [],
        createdAt: row.created_at,
        finalizedAt: row.finalized_at,
      }));

      setMonthlySnapshots(snapshots);
      setError(null);
    } catch (err: any) {
      console.error('Error loading monthly snapshots:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  /**
   * Create or update a monthly snapshot
   */
  const createMonthlySnapshot = useCallback(async (jobs: Job[], month?: number, year?: number) => {
    if (!companyId || !isSupabaseConfigured()) return null;

    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();
    
    const monthInfo = getMonthInfo(new Date(targetYear, targetMonth - 1, 1));
    
    const activeJobs = jobs.filter(j => j.status === JobStatus.Active);
    const completedJobs = jobs.filter(j => j.status === JobStatus.Completed);
    const allRelevantJobs = [...activeJobs, ...completedJobs];
    
    const metrics = calculateJobMetrics(allRelevantJobs);

    try {
      const { data, error: insertError } = await supabase!
        .from('monthly_snapshots')
        .upsert({
          company_id: companyId,
          month: monthInfo.month,
          year: monthInfo.year,
          month_start: monthInfo.monthStart,
          month_end: monthInfo.monthEnd,
          total_earned_revenue: metrics.totalEarnedRevenue,
          total_contract_value: metrics.totalContractValue,
          total_costs_to_date: metrics.totalCostsToDate,
          total_invoiced: metrics.totalInvoiced,
          total_over_billing: metrics.totalOverBilling,
          total_under_billing: metrics.totalUnderBilling,
          active_job_count: activeJobs.length,
          completed_job_count: completedJobs.length,
          snapshot_data: allRelevantJobs,
        }, {
          onConflict: 'company_id,year,month',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await loadMonthlySnapshots();
      return data;
    } catch (err: any) {
      console.error('Error creating monthly snapshot:', err);
      throw err;
    }
  }, [companyId, loadMonthlySnapshots]);

  /**
   * Finalize a month (mark as closed)
   */
  const finalizeMonth = useCallback(async (snapshotId: string) => {
    if (!isSupabaseConfigured()) return;

    try {
      const { error: updateError } = await supabase!
        .from('monthly_snapshots')
        .update({ finalized_at: new Date().toISOString() })
        .eq('id', snapshotId);

      if (updateError) throw updateError;

      await loadMonthlySnapshots();
    } catch (err: any) {
      console.error('Error finalizing month:', err);
      throw err;
    }
  }, [loadMonthlySnapshots]);

  /**
   * Generate month-end report data
   */
  const generateMonthEndReport = useCallback((jobs: Job[]): MonthEndReportData => {
    const monthInfo = getMonthInfo(new Date());
    const relevantJobs = jobs.filter(j => 
      j.status === JobStatus.Active || j.status === JobStatus.Completed
    );
    
    const metrics = calculateJobMetrics(relevantJobs);
    
    const jobDetails = relevantJobs.map(job => {
      const earned = calculateEarnedRevenue(job);
      const billing = calculateBillingDifference(job);
      const contractValue = sumBreakdown(job.contract);
      const costsToDate = sumBreakdown(job.costs);
      const invoiced = sumBreakdown(job.invoiced);
      const budget = sumBreakdown(job.budget);
      const costToComplete = sumBreakdown(job.costToComplete);
      
      const percentComplete = budget > 0 ? (costsToDate / budget) * 100 : 0;
      const forecastedCost = costsToDate + costToComplete;
      const forecastedProfit = contractValue - forecastedCost;
      const profitMargin = contractValue > 0 ? (forecastedProfit / contractValue) * 100 : 0;
      
      return {
        jobId: job.id,
        jobNo: job.jobNo,
        jobName: job.jobName,
        client: job.client,
        projectManager: job.projectManager,
        status: job.status,
        contractValue,
        costsToDate,
        percentComplete,
        earnedRevenue: earned.total,
        invoiced,
        overUnderBilling: billing.difference,
        isOverBilled: billing.isOverBilled,
        forecastedProfit,
        profitMargin,
      };
    }).sort((a, b) => Math.abs(b.overUnderBilling) - Math.abs(a.overUnderBilling));
    
    return {
      month: monthInfo.month,
      year: monthInfo.year,
      monthName: monthInfo.monthName,
      totalEarnedRevenue: metrics.totalEarnedRevenue,
      totalContractValue: metrics.totalContractValue,
      totalCostsToDate: metrics.totalCostsToDate,
      totalInvoiced: metrics.totalInvoiced,
      totalOverBilling: metrics.totalOverBilling,
      totalUnderBilling: metrics.totalUnderBilling,
      netBillingPosition: metrics.totalOverBilling - metrics.totalUnderBilling,
      jobs: jobDetails,
    };
  }, []);

  // Load snapshots on mount
  useEffect(() => {
    loadMonthlySnapshots();
  }, [loadMonthlySnapshots]);

  return {
    monthlySnapshots,
    loading,
    error,
    loadMonthlySnapshots,
    createMonthlySnapshot,
    finalizeMonth,
    generateMonthEndReport,
  };
}

