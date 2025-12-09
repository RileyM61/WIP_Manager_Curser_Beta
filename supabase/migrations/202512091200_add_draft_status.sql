-- Add 'Draft' status to jobs table
-- This migration updates any existing CHECK constraint on the status column
-- to include 'Draft' as a valid status value.

-- First, drop any existing check constraint on the status column
-- (constraint names may vary, so we'll do this safely)
DO $$ 
DECLARE 
    constraint_name text;
BEGIN
    -- Find and drop any check constraints on the status column
    FOR constraint_name IN (
        SELECT con.conname
        FROM pg_catalog.pg_constraint con
        JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
        JOIN pg_catalog.pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE rel.relname = 'jobs'
          AND nsp.nspname = 'public'
          AND con.contype = 'c'
          AND pg_get_constraintdef(con.oid) ILIKE '%status%'
    )
    LOOP
        EXECUTE format('ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- Add the new check constraint that includes Draft
-- Note: If there was no existing constraint, this adds one for data integrity
-- Status values: Draft, Future, Active, On Hold, Completed, Archived
ALTER TABLE public.jobs 
DROP CONSTRAINT IF EXISTS jobs_status_check;

ALTER TABLE public.jobs 
ADD CONSTRAINT jobs_status_check 
CHECK (status IN ('Draft', 'Future', 'Active', 'On Hold', 'Completed', 'Archived'));

-- Add a comment for documentation
COMMENT ON COLUMN public.jobs.status IS 'Job status: Draft (incomplete/wip), Future (upcoming), Active (in progress), On Hold (paused), Completed (finished), Archived (hidden)';
