-- ============================================================================
-- Migration: Job Financial Snapshots
-- Purpose: Store historical per-job financial metrics for WIP cards and job list UI
-- Note: This is a NEW table. The legacy job_snapshots table is NOT modified.
-- ============================================================================

-- Create the job_financial_snapshots table
CREATE TABLE IF NOT EXISTS public.job_financial_snapshots (
  -- ============================================================================
  -- Identifiers
  -- ============================================================================
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  snapshot_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- ============================================================================
  -- Contract / Budget Inputs
  -- ============================================================================
  contract_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  original_budget_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  original_profit_target NUMERIC(14,2) NOT NULL DEFAULT 0,
  original_margin_target NUMERIC(6,3) NOT NULL DEFAULT 0,

  -- ============================================================================
  -- Actuals To Date
  -- ============================================================================
  earned_to_date NUMERIC(14,2) NOT NULL DEFAULT 0,
  invoiced_to_date NUMERIC(14,2) NOT NULL DEFAULT 0,
  cost_labor_to_date NUMERIC(14,2) NOT NULL DEFAULT 0,
  cost_material_to_date NUMERIC(14,2) NOT NULL DEFAULT 0,
  cost_other_to_date NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_cost_to_date NUMERIC(14,2) NOT NULL DEFAULT 0,

  -- ============================================================================
  -- Forecasts (Estimate at Completion)
  -- ============================================================================
  forecasted_cost_final NUMERIC(14,2),
  forecasted_revenue_final NUMERIC(14,2),
  forecasted_profit_final NUMERIC(14,2),
  forecasted_margin_final NUMERIC(6,3),

  -- ============================================================================
  -- Billing / WIP Position
  -- ============================================================================
  billing_position_numeric NUMERIC(14,2),
  billing_position_label TEXT CHECK (billing_position_label IN ('over-billed', 'under-billed', 'on-track')),

  -- ============================================================================
  -- Health Flags
  -- ============================================================================
  at_risk_margin BOOLEAN DEFAULT false,
  behind_schedule BOOLEAN DEFAULT false,

  -- ============================================================================
  -- Constraints
  -- ============================================================================
  -- Prevent duplicate snapshots for the same job at the exact same moment
  UNIQUE(job_id, snapshot_date)
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Primary lookup: Get snapshots for a job ordered by date (most recent first)
CREATE INDEX IF NOT EXISTS idx_job_financial_snapshots_job_date 
  ON public.job_financial_snapshots(job_id, snapshot_date DESC);

-- Company-wide queries (e.g., all snapshots for a company on a given date)
CREATE INDEX IF NOT EXISTS idx_job_financial_snapshots_company_date 
  ON public.job_financial_snapshots(company_id, snapshot_date DESC);

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE public.job_financial_snapshots ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access snapshots for their company
CREATE POLICY "job_financial_snapshots_company"
  ON public.job_financial_snapshots
  FOR ALL
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE user_id = auth.uid()));

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE public.job_financial_snapshots IS 'Historical per-job financial snapshots for WIP tracking and trend analysis';
COMMENT ON COLUMN public.job_financial_snapshots.snapshot_date IS 'Timestamp when the snapshot was taken';
COMMENT ON COLUMN public.job_financial_snapshots.created_at IS 'Record creation timestamp (distinct from snapshot_date for imports)';
COMMENT ON COLUMN public.job_financial_snapshots.billing_position_label IS 'Human-readable billing status: over-billed, under-billed, or on-track';
COMMENT ON COLUMN public.job_financial_snapshots.at_risk_margin IS 'Flag indicating margin is below acceptable threshold';
COMMENT ON COLUMN public.job_financial_snapshots.behind_schedule IS 'Flag indicating job is behind scheduled completion date';
