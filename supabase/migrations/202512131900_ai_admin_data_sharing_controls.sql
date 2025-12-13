-- Migration: AI admin data sharing controls (settings table)
-- Adds workspace-wide toggles for optional AI features and the categories of data that may be shared.

ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS ai_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS ai_share_job_financial_totals boolean NOT NULL DEFAULT true;

ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS ai_share_cost_breakdown_detail boolean NOT NULL DEFAULT false;

ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS ai_share_notes boolean NOT NULL DEFAULT false;

ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS ai_share_client_identifiers boolean NOT NULL DEFAULT false;

ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS ai_share_attachments boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.settings.ai_enabled IS 'Workspace admin toggle for enabling optional AI features';
COMMENT ON COLUMN public.settings.ai_share_job_financial_totals IS 'Allow AI features to use job financial totals';
COMMENT ON COLUMN public.settings.ai_share_cost_breakdown_detail IS 'Allow AI features to use cost breakdown detail (labor/material/other)';
COMMENT ON COLUMN public.settings.ai_share_notes IS 'Allow AI features to use internal notes';
COMMENT ON COLUMN public.settings.ai_share_client_identifiers IS 'Allow AI features to use client/company identifiers in context';
COMMENT ON COLUMN public.settings.ai_share_attachments IS 'Allow AI features to use attachments/images in context';


