-- Migration: Discovery Module Tables
-- Purpose: Tables for Executive Discovery/Interview feature
-- Used for CFO engagement interviews with CEO and leadership team

-- ============================================================================
-- ENGAGEMENTS TABLE
-- Represents a CFO engagement with a client company
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  industry TEXT,
  annual_revenue DECIMAL,
  employee_count INTEGER,
  cfo_user_id UUID REFERENCES auth.users(id),
  cfo_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'discovery',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Status constraint
ALTER TABLE public.engagements
ADD CONSTRAINT check_engagement_status 
CHECK (status IN ('discovery', 'analysis', 'planning', 'active', 'completed'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_engagements_company_id ON public.engagements(company_id);
CREATE INDEX IF NOT EXISTS idx_engagements_cfo_user_id ON public.engagements(cfo_user_id);
CREATE INDEX IF NOT EXISTS idx_engagements_status ON public.engagements(status);

-- Comments
COMMENT ON TABLE public.engagements IS 'CFO engagement records for discovery process';
COMMENT ON COLUMN public.engagements.status IS 'discovery=interviewing, analysis=AI processing, planning=strategy, active=ongoing, completed=finished';

-- ============================================================================
-- INTERVIEW SESSIONS TABLE
-- Individual interview sessions with leadership team members
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  role TEXT NOT NULL,
  
  -- Interviewee Information
  interviewee_name TEXT,
  interviewee_title TEXT,
  interviewee_email TEXT,
  interviewee_phone TEXT,
  
  -- Scheduling
  scheduled_date TIMESTAMPTZ,
  conducted_date TIMESTAMPTZ,
  conducted_by TEXT,
  
  -- Status & Progress
  status TEXT NOT NULL DEFAULT 'scheduled',
  current_section_index INTEGER DEFAULT 0,
  current_question_index INTEGER DEFAULT 0,
  
  -- Responses (stored as JSONB array)
  responses JSONB DEFAULT '[]'::jsonb,
  
  -- Notes
  interviewer_notes TEXT,
  duration_minutes INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Status constraint
ALTER TABLE public.interview_sessions
ADD CONSTRAINT check_interview_status 
CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled'));

-- Role constraint
ALTER TABLE public.interview_sessions
ADD CONSTRAINT check_interview_role 
CHECK (role IN ('ceo', 'controller', 'operations', 'sales'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_interview_sessions_engagement_id ON public.interview_sessions(engagement_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_role ON public.interview_sessions(role);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_status ON public.interview_sessions(status);

-- Comments
COMMENT ON TABLE public.interview_sessions IS 'Individual interview sessions with leadership team members';
COMMENT ON COLUMN public.interview_sessions.responses IS 'JSONB array of {questionId, sectionId, value, notes, timestamp}';

-- ============================================================================
-- DISCOVERY ANALYSES TABLE
-- AI-generated analysis results from completed interviews
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.discovery_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
  
  -- Executive Summary
  executive_summary TEXT,
  
  -- SWOT Analysis (stored as JSONB)
  strengths JSONB DEFAULT '[]'::jsonb,
  weaknesses JSONB DEFAULT '[]'::jsonb,
  opportunities JSONB DEFAULT '[]'::jsonb,
  threats JSONB DEFAULT '[]'::jsonb,
  
  -- Value Builder Integration
  value_builder_inputs JSONB,
  
  -- Strategic Recommendations
  recommendations JSONB DEFAULT '[]'::jsonb,
  
  -- Leadership Alignment
  leadership_alignment JSONB,
  
  -- AI Processing Info
  model_used TEXT,
  processing_time_ms INTEGER,
  
  generated_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_discovery_analyses_engagement_id ON public.discovery_analyses(engagement_id);

-- Comments
COMMENT ON TABLE public.discovery_analyses IS 'AI-generated analysis from interview responses';
COMMENT ON COLUMN public.discovery_analyses.value_builder_inputs IS 'Suggested inputs for Value Builder calculator';
COMMENT ON COLUMN public.discovery_analyses.leadership_alignment IS 'Analysis of leadership team alignment scores';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE public.engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_analyses ENABLE ROW LEVEL SECURITY;

-- Engagements: CFO can see their own engagements
CREATE POLICY "Users can view their own engagements"
  ON public.engagements FOR SELECT
  USING (auth.uid() = cfo_user_id);

CREATE POLICY "Users can insert their own engagements"
  ON public.engagements FOR INSERT
  WITH CHECK (auth.uid() = cfo_user_id);

CREATE POLICY "Users can update their own engagements"
  ON public.engagements FOR UPDATE
  USING (auth.uid() = cfo_user_id);

CREATE POLICY "Users can delete their own engagements"
  ON public.engagements FOR DELETE
  USING (auth.uid() = cfo_user_id);

-- Interview Sessions: Access through engagement ownership
CREATE POLICY "Users can view interview sessions for their engagements"
  ON public.interview_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.engagements e
      WHERE e.id = interview_sessions.engagement_id
      AND e.cfo_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert interview sessions for their engagements"
  ON public.interview_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.engagements e
      WHERE e.id = engagement_id
      AND e.cfo_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update interview sessions for their engagements"
  ON public.interview_sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.engagements e
      WHERE e.id = interview_sessions.engagement_id
      AND e.cfo_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete interview sessions for their engagements"
  ON public.interview_sessions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.engagements e
      WHERE e.id = interview_sessions.engagement_id
      AND e.cfo_user_id = auth.uid()
    )
  );

-- Discovery Analyses: Access through engagement ownership
CREATE POLICY "Users can view analyses for their engagements"
  ON public.discovery_analyses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.engagements e
      WHERE e.id = discovery_analyses.engagement_id
      AND e.cfo_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert analyses for their engagements"
  ON public.discovery_analyses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.engagements e
      WHERE e.id = engagement_id
      AND e.cfo_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update analyses for their engagements"
  ON public.discovery_analyses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.engagements e
      WHERE e.id = discovery_analyses.engagement_id
      AND e.cfo_user_id = auth.uid()
    )
  );

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_engagements_updated_at
  BEFORE UPDATE ON public.engagements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interview_sessions_updated_at
  BEFORE UPDATE ON public.interview_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discovery_analyses_updated_at
  BEFORE UPDATE ON public.discovery_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

