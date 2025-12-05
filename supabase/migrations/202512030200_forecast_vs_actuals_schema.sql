-- Forecast vs Actuals Module Schema
-- Tables for financial statement imports, forecasts, and actuals tracking

-- Chart of Accounts / Line Items Definition
CREATE TABLE IF NOT EXISTS public.forecast_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  statement_type TEXT NOT NULL CHECK (statement_type IN ('income_statement', 'balance_sheet')),
  line_code TEXT NOT NULL,
  line_name TEXT NOT NULL,
  line_category TEXT, -- e.g., 'Revenue', 'COGS', 'Operating Expenses', 'Assets', 'Liabilities'
  line_subcategory TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_calculated BOOLEAN NOT NULL DEFAULT FALSE, -- For subtotals/totals
  calculation_formula TEXT, -- e.g., 'SUM(revenue_lines)' for calculated lines
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, statement_type, line_code)
);

-- Historical Financial Data (36 months imported)
CREATE TABLE IF NOT EXISTS public.forecast_historical_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  line_item_id UUID NOT NULL REFERENCES public.forecast_line_items(id) ON DELETE CASCADE,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  import_batch_id UUID, -- Track which import this came from
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, line_item_id, period_year, period_month)
);

-- Forecast Methodology Configuration per Line
CREATE TABLE IF NOT EXISTS public.forecast_methodologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  line_item_id UUID NOT NULL REFERENCES public.forecast_line_items(id) ON DELETE CASCADE,
  methodology TEXT NOT NULL CHECK (methodology IN (
    'straight_line',      -- Average of historical periods
    'linear_trend',       -- Linear regression trend
    'growth_rate',        -- Apply fixed growth rate
    'seasonal',           -- Seasonal patterns from prior years
    'percent_of_revenue', -- As percentage of revenue line
    'driver_based',       -- Based on another metric/driver
    'manual',             -- Manual entry/override
    'run_rate',           -- Last N months average
    'moving_average'      -- Moving average with window
  )),
  parameters JSONB NOT NULL DEFAULT '{}', -- Methodology-specific params
  -- Example parameters:
  -- growth_rate: { "rate": 0.05, "compounding": "monthly" }
  -- seasonal: { "use_prior_year": true, "adjustment_factor": 1.0 }
  -- percent_of_revenue: { "revenue_line_id": "uuid", "percentage": 0.25 }
  -- run_rate: { "periods": 3 }
  -- moving_average: { "window": 6 }
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, line_item_id)
);

-- Generated Forecasts (12 month rolling)
CREATE TABLE IF NOT EXISTS public.forecast_projections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  line_item_id UUID NOT NULL REFERENCES public.forecast_line_items(id) ON DELETE CASCADE,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  forecast_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  methodology_used TEXT NOT NULL,
  methodology_params JSONB, -- Snapshot of params used
  forecast_version INTEGER NOT NULL DEFAULT 1, -- Increment on re-forecast
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, line_item_id, period_year, period_month, forecast_version)
);

-- Monthly Actuals (current + prior 11 months, updated monthly)
CREATE TABLE IF NOT EXISTS public.forecast_actuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  line_item_id UUID NOT NULL REFERENCES public.forecast_line_items(id) ON DELETE CASCADE,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  actual_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  import_batch_id UUID,
  is_restated BOOLEAN NOT NULL DEFAULT FALSE, -- Flag if changed from prior import
  prior_amount DECIMAL(18,2), -- Previous value if restated
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, line_item_id, period_year, period_month)
);

-- Import Batches for Audit Trail
CREATE TABLE IF NOT EXISTS public.forecast_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  import_type TEXT NOT NULL CHECK (import_type IN ('historical', 'actuals')),
  statement_type TEXT NOT NULL CHECK (statement_type IN ('income_statement', 'balance_sheet', 'both')),
  file_name TEXT,
  period_start TEXT, -- e.g., '2022-01' 
  period_end TEXT,   -- e.g., '2024-12'
  row_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  imported_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Variance Analysis Cache (for performance)
CREATE TABLE IF NOT EXISTS public.forecast_variance_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  line_item_id UUID NOT NULL REFERENCES public.forecast_line_items(id) ON DELETE CASCADE,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,
  is_restated BOOLEAN NOT NULL DEFAULT FALSE,
  forecast_amount DECIMAL(18,2),
  actual_amount DECIMAL(18,2),
  variance_amount DECIMAL(18,2),
  variance_percent DECIMAL(8,4),
  prior_year_actual DECIMAL(18,2),
  prior_year_variance DECIMAL(18,2),
  prior_year_variance_percent DECIMAL(8,4),
  ytd_forecast DECIMAL(18,2),
  ytd_actual DECIMAL(18,2),
  ytd_variance DECIMAL(18,2),
  ytd_variance_percent DECIMAL(8,4),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, line_item_id, period_year, period_month)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_forecast_line_items_company ON public.forecast_line_items(company_id);
CREATE INDEX IF NOT EXISTS idx_forecast_line_items_statement ON public.forecast_line_items(company_id, statement_type);
CREATE INDEX IF NOT EXISTS idx_forecast_historical_period ON public.forecast_historical_data(company_id, period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_forecast_projections_period ON public.forecast_projections(company_id, period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_forecast_actuals_period ON public.forecast_actuals(company_id, period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_forecast_variance_period ON public.forecast_variance_cache(company_id, period_year, period_month);

-- Enable RLS
ALTER TABLE public.forecast_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecast_historical_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecast_methodologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecast_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecast_actuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecast_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecast_variance_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies (simplified - authenticated users can access)
DROP POLICY IF EXISTS "Users can manage forecast line items" ON public.forecast_line_items;
CREATE POLICY "Users can manage forecast line items" ON public.forecast_line_items
  FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can manage forecast historical data" ON public.forecast_historical_data;
CREATE POLICY "Users can manage forecast historical data" ON public.forecast_historical_data
  FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can manage forecast methodologies" ON public.forecast_methodologies;
CREATE POLICY "Users can manage forecast methodologies" ON public.forecast_methodologies
  FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can manage forecast projections" ON public.forecast_projections;
CREATE POLICY "Users can manage forecast projections" ON public.forecast_projections
  FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can manage forecast actuals" ON public.forecast_actuals;
CREATE POLICY "Users can manage forecast actuals" ON public.forecast_actuals
  FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can manage forecast import batches" ON public.forecast_import_batches;
CREATE POLICY "Users can manage forecast import batches" ON public.forecast_import_batches
  FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can manage forecast variance cache" ON public.forecast_variance_cache;
CREATE POLICY "Users can manage forecast variance cache" ON public.forecast_variance_cache
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_forecast_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers (drop first to allow re-run)
DROP TRIGGER IF EXISTS update_forecast_line_items_updated_at ON public.forecast_line_items;
CREATE TRIGGER update_forecast_line_items_updated_at
  BEFORE UPDATE ON public.forecast_line_items
  FOR EACH ROW EXECUTE FUNCTION update_forecast_updated_at();

DROP TRIGGER IF EXISTS update_forecast_historical_data_updated_at ON public.forecast_historical_data;
CREATE TRIGGER update_forecast_historical_data_updated_at
  BEFORE UPDATE ON public.forecast_historical_data
  FOR EACH ROW EXECUTE FUNCTION update_forecast_updated_at();

DROP TRIGGER IF EXISTS update_forecast_methodologies_updated_at ON public.forecast_methodologies;
CREATE TRIGGER update_forecast_methodologies_updated_at
  BEFORE UPDATE ON public.forecast_methodologies
  FOR EACH ROW EXECUTE FUNCTION update_forecast_updated_at();

DROP TRIGGER IF EXISTS update_forecast_projections_updated_at ON public.forecast_projections;
CREATE TRIGGER update_forecast_projections_updated_at
  BEFORE UPDATE ON public.forecast_projections
  FOR EACH ROW EXECUTE FUNCTION update_forecast_updated_at();

DROP TRIGGER IF EXISTS update_forecast_actuals_updated_at ON public.forecast_actuals;
CREATE TRIGGER update_forecast_actuals_updated_at
  BEFORE UPDATE ON public.forecast_actuals
  FOR EACH ROW EXECUTE FUNCTION update_forecast_updated_at();

