-- ============================================================================
-- Migration: Ensure Capacity Planning Tables Exist
-- Purpose: Create capacity_plans and capacity_rows tables if they don't exist
-- ============================================================================

-- Create capacity_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.capacity_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  planning_horizon_weeks INTEGER NOT NULL DEFAULT 4,
  notes TEXT,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id)
);

-- Create capacity_rows table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.capacity_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.capacity_plans(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  discipline TEXT NOT NULL,  -- TEXT allows any discipline value including new ones
  label TEXT NOT NULL,
  headcount INTEGER NOT NULL DEFAULT 1,
  hours_per_person INTEGER NOT NULL DEFAULT 40,
  committed_hours INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.capacity_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capacity_rows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for capacity_plans
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'capacity_plans' AND policyname = 'capacity_plans_company_access'
  ) THEN
    CREATE POLICY "capacity_plans_company_access"
      ON public.capacity_plans
      FOR ALL
      USING (company_id IN (SELECT company_id FROM public.current_user_company_ids()))
      WITH CHECK (company_id IN (SELECT company_id FROM public.current_user_company_ids()));
  END IF;
END $$;

-- RLS Policies for capacity_rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'capacity_rows' AND policyname = 'capacity_rows_company_access'
  ) THEN
    CREATE POLICY "capacity_rows_company_access"
      ON public.capacity_rows
      FOR ALL
      USING (company_id IN (SELECT company_id FROM public.current_user_company_ids()))
      WITH CHECK (company_id IN (SELECT company_id FROM public.current_user_company_ids()));
  END IF;
END $$;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_capacity_plans_company ON public.capacity_plans (company_id);
CREATE INDEX IF NOT EXISTS idx_capacity_rows_plan ON public.capacity_rows (plan_id);
CREATE INDEX IF NOT EXISTS idx_capacity_rows_company ON public.capacity_rows (company_id);

-- Add capacity_plan_id to settings if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'settings' 
    AND column_name = 'capacity_plan_id'
  ) THEN
    ALTER TABLE public.settings ADD COLUMN capacity_plan_id UUID REFERENCES public.capacity_plans(id);
  END IF;
END $$;

COMMENT ON TABLE public.capacity_plans IS 'Stores capacity planning configuration for each company';
COMMENT ON TABLE public.capacity_rows IS 'Stores individual discipline rows for capacity planning';

