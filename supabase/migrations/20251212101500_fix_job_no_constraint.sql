-- Remove the global unique constraint on job_no if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'jobs_job_no_key'
  ) THEN
    ALTER TABLE public.jobs DROP CONSTRAINT jobs_job_no_key;
  END IF;
END $$;

-- Add a composite unique constraint on (company_id, job_no)
-- ensuring we don't add it if it already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'jobs_company_id_job_no_key'
  ) THEN
    ALTER TABLE public.jobs ADD CONSTRAINT jobs_company_id_job_no_key UNIQUE (company_id, job_no);
  END IF;
END $$;
