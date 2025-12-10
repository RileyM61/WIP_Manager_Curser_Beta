-- Run this in Supabase SQL Editor to mark all existing migrations as applied
-- This tells Supabase "these already ran, don't try again"

INSERT INTO supabase_migrations.schema_migrations (version, statements, name)
VALUES
  ('202503071200', NULL, '202503071200_multi_tenant.sql'),
  ('202503071330', NULL, '202503071330_capacity_optional.sql'),
  ('202503071400', NULL, '202503071400_add_estimator_to_jobs.sql'),
  ('202503071500', NULL, '202503071500_add_estimators_to_settings.sql'),
  ('202503071600', NULL, '202503071600_add_job_type_tm_settings.sql'),
  ('202503071700', NULL, '202503071700_invitations_system.sql'),
  ('202503071800', NULL, '202503071800_add_mobilizations.sql'),
  ('202503071900', NULL, '202503071900_add_labor_cost_per_hour.sql'),
  ('202503072100', NULL, '202503072100_managed_companies.sql'),
  ('202503072200', NULL, '202503072200_cfo_pro_applications.sql'),
  ('202503072400', NULL, '202503072400_value_builder_leads.sql'),
  ('202503072500', NULL, '202503072500_weekly_snapshots.sql'),
  ('202503072600', NULL, '202503072600_as_of_date.sql'),
  ('202503072700', NULL, '202503072700_ensure_capacity_tables.sql'),
  ('202503072800', NULL, '202503072800_job_classification.sql'),
  ('202503072900', NULL, '202503072900_discovery_module.sql'),
  ('202503073000', NULL, '202503073000_enhanced_onboarding.sql'),
  ('202512010100', NULL, '202512010100_labor_capacity_module.sql'),
  ('202512010200', NULL, '202512010200_add_termination_date.sql'),
  ('202512020100', NULL, '202512020100_value_builder_module.sql'),
  ('202512030100', NULL, '202512030100_value_driver_assessments.sql'),
  ('202512030200', NULL, '202512030200_forecast_vs_actuals_schema.sql')
ON CONFLICT (version) DO NOTHING;
