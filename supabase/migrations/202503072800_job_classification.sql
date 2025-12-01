-- Migration: Add Job Classification Fields
-- Purpose: Add job category, product type, and complexity for AI post-mortem analysis

-- Add job_category column (Commercial, Government, Residential)
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS job_category TEXT;

-- Add product_type column (Chain Link, Ornamental, Field Fencing, Vinyl, Wood, Other)
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS product_type TEXT;

-- Add job_complexity column (1-5 rating)
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS job_complexity INTEGER;

-- Add check constraint for job_category values
ALTER TABLE public.jobs 
ADD CONSTRAINT check_job_category 
CHECK (job_category IS NULL OR job_category IN ('Commercial', 'Government', 'Residential'));

-- Add check constraint for product_type values
ALTER TABLE public.jobs 
ADD CONSTRAINT check_product_type 
CHECK (product_type IS NULL OR product_type IN ('Chain Link', 'Ornamental', 'Field Fencing', 'Vinyl', 'Wood', 'Other'));

-- Add check constraint for job_complexity values (1-5)
ALTER TABLE public.jobs 
ADD CONSTRAINT check_job_complexity 
CHECK (job_complexity IS NULL OR (job_complexity >= 1 AND job_complexity <= 5));

-- Create indexes for filtering and analysis
CREATE INDEX IF NOT EXISTS idx_jobs_job_category ON public.jobs(job_category);
CREATE INDEX IF NOT EXISTS idx_jobs_product_type ON public.jobs(product_type);
CREATE INDEX IF NOT EXISTS idx_jobs_job_complexity ON public.jobs(job_complexity);

-- Comment on columns
COMMENT ON COLUMN public.jobs.job_category IS 'Job sector: Commercial, Government, or Residential';
COMMENT ON COLUMN public.jobs.product_type IS 'Primary product type: Chain Link, Ornamental, Field Fencing, Vinyl, Wood, or Other';
COMMENT ON COLUMN public.jobs.job_complexity IS 'Complexity rating from 1 (Simple) to 5 (Highly Complex)';

