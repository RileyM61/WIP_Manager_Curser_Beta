-- Migration: Add job_type and tm_settings columns to jobs table
-- This enables support for both Fixed Price and Time & Material job types

-- Add job_type column with default of 'fixed-price' for existing jobs
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS job_type text NOT NULL DEFAULT 'fixed-price';

-- Add tm_settings column as JSONB to store T&M-specific settings
-- This will store: laborBillingType, laborBillRate, laborHours, laborMarkup, materialMarkup, otherMarkup
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS tm_settings jsonb;

-- Add a check constraint to ensure job_type is valid
ALTER TABLE public.jobs 
ADD CONSTRAINT jobs_job_type_check 
CHECK (job_type IN ('fixed-price', 'time-material'));

-- Add an index on job_type for filtering
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON public.jobs(job_type);

-- Comment on new columns
COMMENT ON COLUMN public.jobs.job_type IS 'Type of job: fixed-price or time-material';
COMMENT ON COLUMN public.jobs.tm_settings IS 'T&M settings including labor billing type, rates, markups';

