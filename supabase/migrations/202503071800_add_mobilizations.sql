-- Migration: Add mobilizations field to jobs table
-- This allows storing up to 4 mobilization/demobilization phases per job

-- Add the mobilizations column as JSONB
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS mobilizations jsonb DEFAULT '[]'::jsonb;

-- Add a comment describing the column
COMMENT ON COLUMN public.jobs.mobilizations IS 'Array of mobilization phases, each with id, enabled, mobilizeDate, demobilizeDate, and optional description';

-- Create an index for querying jobs with active mobilizations
CREATE INDEX IF NOT EXISTS idx_jobs_mobilizations ON public.jobs USING gin (mobilizations);

