-- Migration: Enhanced Company Onboarding Fields
-- Purpose: Add additional fields for comprehensive company setup

-- Add industry field
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS industry TEXT;

-- Add annual revenue range field
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS annual_revenue_range TEXT;

-- Add employee count range field
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS employee_count_range TEXT;

-- Add interested modules field (array of module IDs)
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS interested_modules TEXT[];

-- Add service preference field (self-service or managed)
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS service_preference TEXT;

-- Add constraints for valid values
ALTER TABLE public.settings 
ADD CONSTRAINT check_industry 
CHECK (industry IS NULL OR industry IN ('Construction', 'Manufacturing', 'Professional Services', 'Retail', 'Healthcare', 'Technology', 'Other'));

ALTER TABLE public.settings 
ADD CONSTRAINT check_revenue_range 
CHECK (annual_revenue_range IS NULL OR annual_revenue_range IN ('Under $1M', '$1M-$5M', '$5M-$10M', '$10M-$25M', '$25M-$50M', '$50M+'));

ALTER TABLE public.settings 
ADD CONSTRAINT check_employee_range 
CHECK (employee_count_range IS NULL OR employee_count_range IN ('1-10', '11-25', '26-50', '51-100', '100+'));

ALTER TABLE public.settings 
ADD CONSTRAINT check_service_preference 
CHECK (service_preference IS NULL OR service_preference IN ('self-service', 'cfo-managed'));

-- Create indexes for filtering/analytics
CREATE INDEX IF NOT EXISTS idx_settings_industry ON public.settings(industry);
CREATE INDEX IF NOT EXISTS idx_settings_revenue_range ON public.settings(annual_revenue_range);
CREATE INDEX IF NOT EXISTS idx_settings_service_preference ON public.settings(service_preference);

-- Comments
COMMENT ON COLUMN public.settings.industry IS 'Company industry sector';
COMMENT ON COLUMN public.settings.annual_revenue_range IS 'Annual revenue bracket';
COMMENT ON COLUMN public.settings.employee_count_range IS 'Number of employees bracket';
COMMENT ON COLUMN public.settings.interested_modules IS 'Array of module IDs the company is interested in';
COMMENT ON COLUMN public.settings.service_preference IS 'self-service (DIY) or cfo-managed (wants CFO help)';

