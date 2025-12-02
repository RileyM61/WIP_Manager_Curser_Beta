-- Migration: Value Builder Module
-- Tables for business valuations, scenarios, and historical tracking

-- VALUATIONS TABLE (saved valuation scenarios)
CREATE TABLE IF NOT EXISTS public.valuations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.settings(company_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  
  -- Financial inputs
  annual_revenue DECIMAL(14,2) NOT NULL DEFAULT 0,
  net_profit DECIMAL(14,2) NOT NULL DEFAULT 0,
  owner_compensation DECIMAL(14,2) NOT NULL DEFAULT 0,
  depreciation DECIMAL(14,2) NOT NULL DEFAULT 0,
  interest_expense DECIMAL(14,2) NOT NULL DEFAULT 0,
  taxes DECIMAL(14,2) NOT NULL DEFAULT 0,
  other_addbacks DECIMAL(14,2) NOT NULL DEFAULT 0,
  
  -- Calculated values (stored for quick retrieval)
  adjusted_ebitda DECIMAL(14,2) NOT NULL DEFAULT 0,
  multiple DECIMAL(4,2) NOT NULL DEFAULT 3.0 CHECK (multiple >= 1 AND multiple <= 10),
  business_value DECIMAL(14,2) NOT NULL DEFAULT 0,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_valuations_company ON public.valuations(company_id);
CREATE INDEX IF NOT EXISTS idx_valuations_current ON public.valuations(company_id, is_current) WHERE is_current = true;
ALTER TABLE public.valuations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for valuations
CREATE POLICY "Users can view valuations for their company"
  ON public.valuations FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage valuations for their company"
  ON public.valuations FOR ALL
  USING (company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  ));

-- VALUE HISTORY TABLE (snapshots for tracking value over time)
CREATE TABLE IF NOT EXISTS public.value_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.settings(company_id) ON DELETE CASCADE,
  valuation_id UUID REFERENCES public.valuations(id) ON DELETE SET NULL,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  adjusted_ebitda DECIMAL(14,2) NOT NULL DEFAULT 0,
  multiple DECIMAL(4,2) NOT NULL DEFAULT 3.0,
  business_value DECIMAL(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, recorded_at)
);

CREATE INDEX IF NOT EXISTS idx_value_history_company ON public.value_history(company_id);
CREATE INDEX IF NOT EXISTS idx_value_history_date ON public.value_history(company_id, recorded_at);
ALTER TABLE public.value_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for value_history
CREATE POLICY "Users can view value history for their company"
  ON public.value_history FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage value history for their company"
  ON public.value_history FOR ALL
  USING (company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  ));

-- Trigger to update updated_at on valuations
CREATE OR REPLACE FUNCTION update_valuations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER valuations_updated_at
  BEFORE UPDATE ON public.valuations
  FOR EACH ROW
  EXECUTE FUNCTION update_valuations_updated_at();

-- Function to ensure only one "current" valuation per company
CREATE OR REPLACE FUNCTION ensure_single_current_valuation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_current = true THEN
    UPDATE public.valuations 
    SET is_current = false 
    WHERE company_id = NEW.company_id 
      AND id != NEW.id 
      AND is_current = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_current
  BEFORE INSERT OR UPDATE ON public.valuations
  FOR EACH ROW
  WHEN (NEW.is_current = true)
  EXECUTE FUNCTION ensure_single_current_valuation();

