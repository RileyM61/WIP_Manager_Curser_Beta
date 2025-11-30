-- ============================================================================
-- Migration: Weekly Snapshots for Reporting
-- Purpose: Store weekly job snapshots for earned revenue tracking and reporting
-- ============================================================================

-- Create weekly_snapshots table
CREATE TABLE IF NOT EXISTS public.weekly_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Week identification
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  week_number INTEGER NOT NULL, -- ISO week number (1-52)
  year INTEGER NOT NULL,
  
  -- Aggregated metrics (for quick queries without parsing JSONB)
  total_earned_revenue DECIMAL NOT NULL DEFAULT 0,
  total_contract_value DECIMAL NOT NULL DEFAULT 0,
  total_costs_to_date DECIMAL NOT NULL DEFAULT 0,
  total_invoiced DECIMAL NOT NULL DEFAULT 0,
  active_job_count INTEGER NOT NULL DEFAULT 0,
  
  -- Full snapshot data for detailed reporting
  snapshot_data JSONB NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure one snapshot per company per week
  UNIQUE(company_id, year, week_number)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_weekly_snapshots_company_date 
  ON public.weekly_snapshots (company_id, week_start DESC);

CREATE INDEX IF NOT EXISTS idx_weekly_snapshots_company_year_week 
  ON public.weekly_snapshots (company_id, year DESC, week_number DESC);

-- Enable RLS
ALTER TABLE public.weekly_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their company's snapshots
CREATE POLICY "weekly_snapshots_company"
  ON public.weekly_snapshots
  FOR ALL
  USING (company_id IN (SELECT company_id FROM public.current_user_company_ids()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.current_user_company_ids()));

-- ============================================================================
-- Monthly Report Snapshots (for month-end reporting)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.monthly_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Month identification
  month INTEGER NOT NULL, -- 1-12
  year INTEGER NOT NULL,
  month_start DATE NOT NULL,
  month_end DATE NOT NULL,
  
  -- Aggregated metrics
  total_earned_revenue DECIMAL NOT NULL DEFAULT 0,
  total_contract_value DECIMAL NOT NULL DEFAULT 0,
  total_costs_to_date DECIMAL NOT NULL DEFAULT 0,
  total_invoiced DECIMAL NOT NULL DEFAULT 0,
  total_over_billing DECIMAL NOT NULL DEFAULT 0,
  total_under_billing DECIMAL NOT NULL DEFAULT 0,
  active_job_count INTEGER NOT NULL DEFAULT 0,
  completed_job_count INTEGER NOT NULL DEFAULT 0,
  
  -- Full snapshot data for detailed reporting
  snapshot_data JSONB NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  finalized_at TIMESTAMPTZ, -- When the month was "closed" by the user
  
  -- Ensure one snapshot per company per month
  UNIQUE(company_id, year, month)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_company_date 
  ON public.monthly_snapshots (company_id, year DESC, month DESC);

-- Enable RLS
ALTER TABLE public.monthly_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "monthly_snapshots_company"
  ON public.monthly_snapshots
  FOR ALL
  USING (company_id IN (SELECT company_id FROM public.current_user_company_ids()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.current_user_company_ids()));

-- ============================================================================
-- Helper function to get ISO week number
-- ============================================================================

CREATE OR REPLACE FUNCTION get_iso_week_info(input_date DATE)
RETURNS TABLE (
  week_number INTEGER,
  year INTEGER,
  week_start DATE,
  week_end DATE
) AS $$
BEGIN
  RETURN QUERY SELECT
    EXTRACT(WEEK FROM input_date)::INTEGER,
    EXTRACT(ISOYEAR FROM input_date)::INTEGER,
    DATE_TRUNC('week', input_date)::DATE,
    (DATE_TRUNC('week', input_date) + INTERVAL '6 days')::DATE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE public.weekly_snapshots IS 'Weekly job snapshots for earned revenue tracking (5-week lookback)';
COMMENT ON TABLE public.monthly_snapshots IS 'Monthly job snapshots for month-end accounting reports';
COMMENT ON COLUMN public.weekly_snapshots.snapshot_data IS 'JSONB containing full job array with all metrics at snapshot time';
COMMENT ON COLUMN public.monthly_snapshots.finalized_at IS 'Timestamp when accountant marked the month as closed/finalized';

