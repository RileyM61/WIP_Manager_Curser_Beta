-- Migration: Add Default T&M Markup Settings
-- Description: Add columns for default markup settings that apply to new T&M jobs

-- Add default labor bill rate ($/hr)
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS default_labor_bill_rate DECIMAL(10,2);

-- Add default material markup (multiplier, e.g., 1.15 = 15%)
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS default_material_markup DECIMAL(5,3);

-- Add default other markup (multiplier, e.g., 1.10 = 10%)
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS default_other_markup DECIMAL(5,3);

-- Add comments for documentation
COMMENT ON COLUMN public.settings.default_labor_bill_rate IS 'Default labor bill rate $/hr for new T&M jobs';
COMMENT ON COLUMN public.settings.default_material_markup IS 'Default material markup multiplier for new T&M jobs (e.g., 1.15 = 15%)';
COMMENT ON COLUMN public.settings.default_other_markup IS 'Default other costs markup multiplier for new T&M jobs (e.g., 1.10 = 10%)';
