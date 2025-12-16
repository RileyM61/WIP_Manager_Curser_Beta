import { useState, useEffect, useCallback } from 'react';
import { AuditLogEntry, AuditLogFilters } from '../types/audit';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Transform Supabase audit_log row to app AuditLogEntry type
 */
function dbAuditLogToApp(dbLog: any): AuditLogEntry {
  return {
    id: dbLog.id,
    companyId: dbLog.company_id,
    entityType: dbLog.entity_type,
    entityId: dbLog.entity_id,
    entityName: dbLog.entity_name,
    action: dbLog.action,
    changedBy: dbLog.changed_by,
    changedByEmail: dbLog.changed_by_email,
    changedAt: dbLog.changed_at,
    changes: dbLog.changes || [],
    createdAt: dbLog.created_at,
  };
}

/**
 * Hook for fetching and filtering audit log entries
 */
export function useAuditLog(companyId?: string | null) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch audit log entries with optional filters
   */
  const fetchAuditLog = useCallback(async (filters: AuditLogFilters = {}, limit: number = 500) => {
    if (!companyId) {
      setEntries([]);
      setError(null);
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured()) {
      setError('Supabase not configured');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase!
        .from('audit_log')
        .select('*')
        .eq('company_id', companyId)
        .order('changed_at', { ascending: false })
        .limit(limit);

      // Apply filters
      if (filters.entityType) {
        query = query.eq('entity_type', filters.entityType);
      }

      if (filters.entityId) {
        query = query.eq('entity_id', filters.entityId);
      }

      if (filters.action) {
        query = query.eq('action', filters.action);
      }

      if (filters.changedBy) {
        query = query.eq('changed_by', filters.changedBy);
      }

      if (filters.startDate) {
        query = query.gte('changed_at', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('changed_at', filters.endDate);
      }

      // Search query - search in entity_name
      if (filters.searchQuery) {
        query = query.ilike('entity_name', `%${filters.searchQuery}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const appEntries = (data || []).map(dbAuditLogToApp);
      setEntries(appEntries);
    } catch (err: any) {
      console.error('Error loading audit log:', err);
      setError(err.message || 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  /**
   * Get audit log entries for a specific job
   */
  const getJobAuditLog = useCallback(async (jobId: string) => {
    return fetchAuditLog({ entityType: 'job', entityId: jobId });
  }, [fetchAuditLog]);

  /**
   * Get audit log entries for a specific change order
   */
  const getChangeOrderAuditLog = useCallback(async (changeOrderId: string) => {
    return fetchAuditLog({ entityType: 'change_order', entityId: changeOrderId });
  }, [fetchAuditLog]);

  return {
    entries,
    loading,
    error,
    fetchAuditLog,
    getJobAuditLog,
    getChangeOrderAuditLog,
    refreshAuditLog: (filters?: AuditLogFilters) => fetchAuditLog(filters),
  };
}

