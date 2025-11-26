-- Migration: Add estimator column to jobs table
-- This allows jobs to be assigned to an estimator for the Estimator role feature

-- Add estimator column to jobs table
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS estimator text;

-- Add index for faster filtering by estimator
CREATE INDEX IF NOT EXISTS idx_jobs_estimator ON public.jobs(estimator);

-- Note: The estimator field uses the same list as project_managers in settings
-- No separate estimators list is needed

