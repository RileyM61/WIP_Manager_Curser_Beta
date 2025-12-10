-- Migration: Change Orders Support
-- Description: Add change_orders table to track COs that can be Fixed Price or T&M
--              regardless of the parent job type

-- ============================================================================
-- Create change_orders table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.change_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- CO Identification
  co_number INTEGER NOT NULL,  -- Sequential per job (1, 2, 3...)
  description TEXT,
  
  -- CO Type (independent of parent job type)
  co_type TEXT NOT NULL DEFAULT 'fixed-price' CHECK (co_type IN ('fixed-price', 'time-material')),
  
  -- Status workflow: pending -> approved/rejected -> completed
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  
  -- Contract/Budget (mirrors job structure)
  contract_labor DECIMAL(14,2) NOT NULL DEFAULT 0,
  contract_material DECIMAL(14,2) NOT NULL DEFAULT 0,
  contract_other DECIMAL(14,2) NOT NULL DEFAULT 0,
  
  budget_labor DECIMAL(14,2) NOT NULL DEFAULT 0,
  budget_material DECIMAL(14,2) NOT NULL DEFAULT 0,
  budget_other DECIMAL(14,2) NOT NULL DEFAULT 0,
  
  -- Actuals
  costs_labor DECIMAL(14,2) NOT NULL DEFAULT 0,
  costs_material DECIMAL(14,2) NOT NULL DEFAULT 0,
  costs_other DECIMAL(14,2) NOT NULL DEFAULT 0,
  
  invoiced_labor DECIMAL(14,2) NOT NULL DEFAULT 0,
  invoiced_material DECIMAL(14,2) NOT NULL DEFAULT 0,
  invoiced_other DECIMAL(14,2) NOT NULL DEFAULT 0,
  
  cost_to_complete_labor DECIMAL(14,2) NOT NULL DEFAULT 0,
  cost_to_complete_material DECIMAL(14,2) NOT NULL DEFAULT 0,
  cost_to_complete_other DECIMAL(14,2) NOT NULL DEFAULT 0,
  
  -- T&M Settings (for T&M COs only)
  tm_settings JSONB,
  
  -- Tracking dates
  submitted_date TIMESTAMPTZ,
  approved_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Ensure CO numbers are unique per job
  UNIQUE(job_id, co_number)
);

-- ============================================================================
-- Indexes for efficient queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_change_orders_job_id ON public.change_orders(job_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_company_id ON public.change_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_status ON public.change_orders(status);
CREATE INDEX IF NOT EXISTS idx_change_orders_job_status ON public.change_orders(job_id, status);

-- ============================================================================
-- Enable Row Level Security
-- ============================================================================
ALTER TABLE public.change_orders ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies (same pattern as jobs table)
-- ============================================================================

-- Users can view change orders for jobs in their company
CREATE POLICY "Users can view change orders for their company"
  ON public.change_orders
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Users can insert change orders for jobs in their company
CREATE POLICY "Users can insert change orders for their company"
  ON public.change_orders
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Users can update change orders for jobs in their company
CREATE POLICY "Users can update change orders for their company"
  ON public.change_orders
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Users can delete change orders for jobs in their company
CREATE POLICY "Users can delete change orders for their company"
  ON public.change_orders
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON TABLE public.change_orders IS 'Change orders for jobs - can be Fixed Price or T&M independent of parent job type';
COMMENT ON COLUMN public.change_orders.co_number IS 'Sequential CO number per job (1, 2, 3...)';
COMMENT ON COLUMN public.change_orders.co_type IS 'Type: fixed-price or time-material (independent of parent job)';
COMMENT ON COLUMN public.change_orders.status IS 'Workflow status: pending, approved, rejected, completed';
COMMENT ON COLUMN public.change_orders.tm_settings IS 'T&M settings (labor billing type, rates, markups) for T&M COs';
