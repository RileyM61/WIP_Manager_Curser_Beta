-- ============================================================================
-- Migration: Add As Of Date field to Jobs
-- Purpose: Allow users to specify what period financial data represents
--          (for accurate period reporting when data is entered after month-end)
-- ============================================================================

-- Add as_of_date column to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS as_of_date DATE;

-- Create index for efficient period-based queries
CREATE INDEX IF NOT EXISTS idx_jobs_as_of_date 
  ON public.jobs (as_of_date DESC);

-- Create composite index for company + as_of_date queries
CREATE INDEX IF NOT EXISTS idx_jobs_company_as_of_date 
  ON public.jobs (company_id, as_of_date DESC);

-- Add comment for documentation
COMMENT ON COLUMN public.jobs.as_of_date IS 
  'The date the financial data (costs, billing) represents. Allows entering data after period close while maintaining accurate historical reporting.';

-- ============================================================================
-- Backfill existing jobs with last_updated as their as_of_date
-- ============================================================================
UPDATE public.jobs 
SET as_of_date = COALESCE(last_updated::date, CURRENT_DATE)
WHERE as_of_date IS NULL;

