-- Migration: Add labor_cost_per_hour to jobs table
-- This field stores the $/hr rate for converting labor costs to hours for capacity planning

ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS labor_cost_per_hour numeric(10,2);

COMMENT ON COLUMN public.jobs.labor_cost_per_hour IS 'Labor cost per hour ($/hr) used to calculate labor hours from labor costs for capacity planning';

