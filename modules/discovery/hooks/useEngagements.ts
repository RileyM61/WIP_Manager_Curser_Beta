/**
 * useEngagements Hook
 * 
 * Manages engagement data including CRUD operations
 * and interview session management.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { 
  Engagement, 
  InterviewSession, 
  InterviewRole, 
  EngagementStatus,
  InterviewStatus,
  InterviewResponse,
  ROLE_DISPLAY_NAMES 
} from '../types';
import { INTERVIEW_TEMPLATES, getTemplateByRole } from '../templates';

interface UseEngagementsReturn {
  engagements: Engagement[];
  loading: boolean;
  error: string | null;
  
  // Engagement operations
  createEngagement: (data: Partial<Engagement>) => Promise<Engagement | null>;
  updateEngagement: (id: string, data: Partial<Engagement>) => Promise<boolean>;
  deleteEngagement: (id: string) => Promise<boolean>;
  
  // Interview session operations
  getInterviewSessions: (engagementId: string) => Promise<InterviewSession[]>;
  updateInterviewSession: (sessionId: string, data: Partial<InterviewSession>) => Promise<boolean>;
  saveInterviewResponse: (sessionId: string, response: InterviewResponse) => Promise<boolean>;
  
  // Refresh
  refresh: () => Promise<void>;
}

export function useEngagements(): UseEngagementsReturn {
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all engagements for the current user
  const fetchEngagements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setEngagements([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('engagements')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const mapped: Engagement[] = (data || []).map(row => ({
        id: row.id,
        companyId: row.company_id,
        companyName: row.company_name,
        industry: row.industry,
        annualRevenue: row.annual_revenue ? Number(row.annual_revenue) : undefined,
        employeeCount: row.employee_count,
        cfoUserId: row.cfo_user_id,
        cfoName: row.cfo_name,
        status: row.status as EngagementStatus,
        startDate: row.start_date,
        completedDate: row.completed_date,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      setEngagements(mapped);
    } catch (err: any) {
      console.error('Error fetching engagements:', err);
      setError(err.message || 'Failed to load engagements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEngagements();
  }, [fetchEngagements]);

  // Create a new engagement with default interview sessions
  const createEngagement = useCallback(async (data: Partial<Engagement>): Promise<Engagement | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create engagement
      const { data: engagementRow, error: engError } = await supabase
        .from('engagements')
        .insert({
          company_name: data.companyName,
          company_id: data.companyId || null,
          industry: data.industry || null,
          annual_revenue: data.annualRevenue || null,
          employee_count: data.employeeCount || null,
          cfo_user_id: user.id,
          cfo_name: data.cfoName || user.email || 'CFO',
          status: 'discovery',
          notes: data.notes || null,
        })
        .select()
        .single();

      if (engError) throw engError;

      // Create default interview sessions for each role
      const roles: InterviewRole[] = ['ceo', 'controller', 'operations', 'sales'];
      const sessionInserts = roles.map(role => {
        const template = getTemplateByRole(role);
        return {
          engagement_id: engagementRow.id,
          template_id: template.id,
          role: role,
          status: 'scheduled',
          conducted_by: data.cfoName || user.email || 'CFO',
          responses: [],
        };
      });

      const { error: sessError } = await supabase
        .from('interview_sessions')
        .insert(sessionInserts);

      if (sessError) {
        console.error('Error creating interview sessions:', sessError);
        // Don't fail the whole operation, engagement was created
      }

      const newEngagement: Engagement = {
        id: engagementRow.id,
        companyId: engagementRow.company_id,
        companyName: engagementRow.company_name,
        industry: engagementRow.industry,
        annualRevenue: engagementRow.annual_revenue ? Number(engagementRow.annual_revenue) : undefined,
        employeeCount: engagementRow.employee_count,
        cfoUserId: engagementRow.cfo_user_id,
        cfoName: engagementRow.cfo_name,
        status: engagementRow.status as EngagementStatus,
        startDate: engagementRow.start_date,
        completedDate: engagementRow.completed_date,
        notes: engagementRow.notes,
        createdAt: engagementRow.created_at,
        updatedAt: engagementRow.updated_at,
      };

      setEngagements(prev => [newEngagement, ...prev]);
      return newEngagement;
    } catch (err: any) {
      console.error('Error creating engagement:', err);
      setError(err.message || 'Failed to create engagement');
      return null;
    }
  }, []);

  // Update an engagement
  const updateEngagement = useCallback(async (id: string, data: Partial<Engagement>): Promise<boolean> => {
    try {
      const updateData: any = {};
      if (data.companyName !== undefined) updateData.company_name = data.companyName;
      if (data.industry !== undefined) updateData.industry = data.industry;
      if (data.annualRevenue !== undefined) updateData.annual_revenue = data.annualRevenue;
      if (data.employeeCount !== undefined) updateData.employee_count = data.employeeCount;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.completedDate !== undefined) updateData.completed_date = data.completedDate;

      const { error: updateError } = await supabase
        .from('engagements')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      setEngagements(prev => prev.map(e => 
        e.id === id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e
      ));

      return true;
    } catch (err: any) {
      console.error('Error updating engagement:', err);
      setError(err.message || 'Failed to update engagement');
      return false;
    }
  }, []);

  // Delete an engagement
  const deleteEngagement = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('engagements')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setEngagements(prev => prev.filter(e => e.id !== id));
      return true;
    } catch (err: any) {
      console.error('Error deleting engagement:', err);
      setError(err.message || 'Failed to delete engagement');
      return false;
    }
  }, []);

  // Get interview sessions for an engagement
  const getInterviewSessions = useCallback(async (engagementId: string): Promise<InterviewSession[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('role');

      if (fetchError) throw fetchError;

      return (data || []).map(row => ({
        id: row.id,
        engagementId: row.engagement_id,
        templateId: row.template_id,
        role: row.role as InterviewRole,
        intervieweeName: row.interviewee_name || '',
        intervieweeTitle: row.interviewee_title || '',
        intervieweeEmail: row.interviewee_email,
        intervieweePhone: row.interviewee_phone,
        scheduledDate: row.scheduled_date,
        conductedDate: row.conducted_date,
        conductedBy: row.conducted_by || '',
        status: row.status as InterviewStatus,
        currentSectionIndex: row.current_section_index || 0,
        currentQuestionIndex: row.current_question_index || 0,
        responses: row.responses || [],
        interviewerNotes: row.interviewer_notes,
        duration: row.duration_minutes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (err: any) {
      console.error('Error fetching interview sessions:', err);
      return [];
    }
  }, []);

  // Update an interview session
  const updateInterviewSession = useCallback(async (
    sessionId: string, 
    data: Partial<InterviewSession>
  ): Promise<boolean> => {
    try {
      const updateData: any = {};
      if (data.intervieweeName !== undefined) updateData.interviewee_name = data.intervieweeName;
      if (data.intervieweeTitle !== undefined) updateData.interviewee_title = data.intervieweeTitle;
      if (data.intervieweeEmail !== undefined) updateData.interviewee_email = data.intervieweeEmail;
      if (data.intervieweePhone !== undefined) updateData.interviewee_phone = data.intervieweePhone;
      if (data.scheduledDate !== undefined) updateData.scheduled_date = data.scheduledDate;
      if (data.conductedDate !== undefined) updateData.conducted_date = data.conductedDate;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.currentSectionIndex !== undefined) updateData.current_section_index = data.currentSectionIndex;
      if (data.currentQuestionIndex !== undefined) updateData.current_question_index = data.currentQuestionIndex;
      if (data.responses !== undefined) updateData.responses = data.responses;
      if (data.interviewerNotes !== undefined) updateData.interviewer_notes = data.interviewerNotes;
      if (data.duration !== undefined) updateData.duration_minutes = data.duration;

      const { error: updateError } = await supabase
        .from('interview_sessions')
        .update(updateData)
        .eq('id', sessionId);

      if (updateError) throw updateError;
      return true;
    } catch (err: any) {
      console.error('Error updating interview session:', err);
      return false;
    }
  }, []);

  // Save a single response to an interview session
  const saveInterviewResponse = useCallback(async (
    sessionId: string, 
    response: InterviewResponse
  ): Promise<boolean> => {
    try {
      // First, get current responses
      const { data: session, error: fetchError } = await supabase
        .from('interview_sessions')
        .select('responses')
        .eq('id', sessionId)
        .single();

      if (fetchError) throw fetchError;

      const currentResponses: InterviewResponse[] = session?.responses || [];
      
      // Update or add the response
      const existingIndex = currentResponses.findIndex(r => r.questionId === response.questionId);
      if (existingIndex >= 0) {
        currentResponses[existingIndex] = response;
      } else {
        currentResponses.push(response);
      }

      // Save back
      const { error: updateError } = await supabase
        .from('interview_sessions')
        .update({ responses: currentResponses })
        .eq('id', sessionId);

      if (updateError) throw updateError;
      return true;
    } catch (err: any) {
      console.error('Error saving response:', err);
      return false;
    }
  }, []);

  return {
    engagements,
    loading,
    error,
    createEngagement,
    updateEngagement,
    deleteEngagement,
    getInterviewSessions,
    updateInterviewSession,
    saveInterviewResponse,
    refresh: fetchEngagements,
  };
}

export default useEngagements;

