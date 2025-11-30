-- ============================================================================
-- Migration: Value Builder Leads Table
-- Free calculator lead generation system
-- ============================================================================

-- Create the value_builder_leads table
CREATE TABLE IF NOT EXISTS public.value_builder_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Contact Information
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  phone TEXT,
  
  -- Business Context
  annual_revenue_range TEXT NOT NULL, -- 'under-1m', '1m-5m', '5m-10m', '10m-25m', '25m-50m', '50m-100m', 'over-100m'
  
  -- Calculator Results (updated when they use the calculator)
  calculated_ebitda DECIMAL,
  calculated_value DECIMAL,
  multiple_used DECIMAL,
  last_calculated_at TIMESTAMP WITH TIME ZONE,
  
  -- Lead Tracking
  source TEXT DEFAULT 'value-builder-calculator',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Internal Status
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'converted', 'unqualified'
  notes TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  
  -- Conversion Tracking
  converted_to_trial BOOLEAN DEFAULT false,
  converted_at TIMESTAMP WITH TIME ZONE,
  converted_company_id UUID REFERENCES public.companies(id)
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_value_builder_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_value_builder_leads_updated_at
  BEFORE UPDATE ON public.value_builder_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_value_builder_leads_updated_at();

-- Enable Row Level Security
ALTER TABLE public.value_builder_leads ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous inserts (for the lead form)
CREATE POLICY "Allow public insert for value_builder_leads"
  ON public.value_builder_leads
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow the lead to update their own record (via email match)
CREATE POLICY "Allow lead to update own record"
  ON public.value_builder_leads
  FOR UPDATE
  USING (email = current_setting('request.jwt.claims', true)::json->>'email')
  WITH CHECK (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Policy: Authenticated users (admins/staff) can view and manage all leads
CREATE POLICY "Allow authenticated full access to value_builder_leads"
  ON public.value_builder_leads
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_value_builder_leads_email ON public.value_builder_leads (email);
CREATE INDEX IF NOT EXISTS idx_value_builder_leads_status ON public.value_builder_leads (status);
CREATE INDEX IF NOT EXISTS idx_value_builder_leads_created_at ON public.value_builder_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_value_builder_leads_source ON public.value_builder_leads (source);
CREATE INDEX IF NOT EXISTS idx_value_builder_leads_revenue_range ON public.value_builder_leads (annual_revenue_range);

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

-- Lead conversion funnel view
CREATE OR REPLACE VIEW public.value_builder_lead_stats AS
SELECT 
  DATE_TRUNC('day', created_at) as day,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE calculated_value IS NOT NULL) as calculated_value,
  COUNT(*) FILTER (WHERE status = 'contacted') as contacted,
  COUNT(*) FILTER (WHERE status = 'qualified') as qualified,
  COUNT(*) FILTER (WHERE converted_to_trial = true) as converted,
  AVG(calculated_value) FILTER (WHERE calculated_value IS NOT NULL) as avg_calculated_value,
  AVG(multiple_used) FILTER (WHERE multiple_used IS NOT NULL) as avg_multiple_used
FROM public.value_builder_leads
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY day DESC;

-- Revenue range distribution view
CREATE OR REPLACE VIEW public.value_builder_lead_by_revenue AS
SELECT 
  annual_revenue_range,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE converted_to_trial = true) as converted,
  ROUND(100.0 * COUNT(*) FILTER (WHERE converted_to_trial = true) / COUNT(*), 2) as conversion_rate
FROM public.value_builder_leads
GROUP BY annual_revenue_range
ORDER BY 
  CASE annual_revenue_range
    WHEN 'under-1m' THEN 1
    WHEN '1m-5m' THEN 2
    WHEN '5m-10m' THEN 3
    WHEN '10m-25m' THEN 4
    WHEN '25m-50m' THEN 5
    WHEN '50m-100m' THEN 6
    WHEN 'over-100m' THEN 7
    ELSE 8
  END;

-- Grant access to views for authenticated users
GRANT SELECT ON public.value_builder_lead_stats TO authenticated;
GRANT SELECT ON public.value_builder_lead_by_revenue TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE public.value_builder_leads IS 'Leads captured from the Value Builder free calculator';
COMMENT ON COLUMN public.value_builder_leads.annual_revenue_range IS 'Revenue range selected during signup: under-1m, 1m-5m, 5m-10m, 10m-25m, 25m-50m, 50m-100m, over-100m';
COMMENT ON COLUMN public.value_builder_leads.calculated_value IS 'Business value calculated using the tool';
COMMENT ON COLUMN public.value_builder_leads.multiple_used IS 'EBITDA multiple used in their calculation';

