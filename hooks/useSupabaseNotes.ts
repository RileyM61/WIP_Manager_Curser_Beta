import { useCallback } from 'react';
import { Note } from '../types';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { dbNoteToAppNote } from './supabaseHelpers';

export function useSupabaseNotes(companyId?: string | null) {
  const loadNotes = useCallback(async (jobId: string): Promise<Note[]> => {
    if (!isSupabaseConfigured() || !companyId) return [];

    try {
      const { data, error } = await supabase!
        .from('job_notes')
        .select('*')
        .eq('job_id', jobId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(dbNoteToAppNote);
    } catch (err: any) {
      console.error('Error loading notes:', err);
      return [];
    }
  }, [companyId]);

  const addNote = useCallback(async (jobId: string, noteText: string): Promise<Note> => {
    if (!isSupabaseConfigured() || !companyId) throw new Error('Supabase not configured');

    try {
      const { data, error } = await supabase!
        .from('job_notes')
        .insert({
          job_id: jobId,
          body: noteText,
          company_id: companyId,
        })
        .select()
        .single();

      if (error) throw error;

      return dbNoteToAppNote(data);
    } catch (err: any) {
      console.error('Error adding note:', err);
      throw err;
    }
  }, [companyId]);

  return {
    loadNotes,
    addNote,
  };
}

