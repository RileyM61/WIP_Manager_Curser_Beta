import { useState, useEffect, useCallback } from 'react';
import { Job } from '../types';
import { supabase, isSupabaseConfigured, dbJobToAppJob, appJobToDbJob } from '../lib/supabase';

export function useSupabaseJobs(companyId?: string | null) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    if (!companyId) {
      setJobs([]);
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
      const { data, error: fetchError } = await supabase!
        .from('jobs')
        .select('*')
        .eq('company_id', companyId)
        .order('last_updated', { ascending: false });

      if (fetchError) throw fetchError;

      const appJobs = (data || []).map(dbJobToAppJob);
      setJobs(appJobs);
      setError(null);
    } catch (err: any) {
      console.error('Error loading jobs:', err);
      setError(err.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const addJob = useCallback(async (job: Job) => {
    if (!isSupabaseConfigured() || !companyId) return;

    try {
      const dbJob = { ...appJobToDbJob(job), company_id: companyId };
      const { data, error: insertError } = await supabase!
        .from('jobs')
        .insert(dbJob)
        .select()
        .single();

      if (insertError) throw insertError;

      const newJob = dbJobToAppJob(data);
      setJobs(prev => [...prev, newJob]);
      return newJob;
    } catch (err: any) {
      console.error('Error adding job:', err);
      throw err;
    }
  }, [companyId]);

  const updateJob = useCallback(async (job: Job) => {
    if (!isSupabaseConfigured() || !companyId) return;

    try {
      const dbJob = { ...appJobToDbJob(job), company_id: companyId };
      const { data, error: updateError } = await supabase!
        .from('jobs')
        .update({ ...dbJob, last_updated: new Date().toISOString() })
        .eq('id', job.id)
        .select()
        .single();

      if (updateError) throw updateError;

      const updatedJob = dbJobToAppJob(data);
      setJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
      return updatedJob;
    } catch (err: any) {
      console.error('Error updating job:', err);
      throw err;
    }
  }, [companyId]);

  const deleteJob = useCallback(async (jobId: string) => {
    if (!isSupabaseConfigured() || !companyId) return;

    try {
      const { error: deleteError } = await supabase!
        .from('jobs')
        .delete()
        .eq('id', jobId)
        .eq('company_id', companyId);

      if (deleteError) throw deleteError;

      setJobs(prev => prev.filter(j => j.id !== jobId));
    } catch (err: any) {
      console.error('Error deleting job:', err);
      throw err;
    }
  }, [companyId]);

  return {
    jobs,
    loading,
    error,
    addJob,
    updateJob,
    deleteJob,
    refreshJobs: loadJobs,
  };
}

