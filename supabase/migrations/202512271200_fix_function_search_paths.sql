-- Migration: Fix Function Search Paths
-- Description: Sets search_path on functions to prevent security vulnerabilities
-- See: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- Fix search_path for update_value_driver_assessments_updated_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'update_value_driver_assessments_updated_at' 
    AND pronamespace = 'public'::regnamespace
  ) THEN
    ALTER FUNCTION public.update_value_driver_assessments_updated_at() SET search_path = public;
  END IF;
END $$;

-- Fix search_path for update_forecast_updated_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'update_forecast_updated_at' 
    AND pronamespace = 'public'::regnamespace
  ) THEN
    ALTER FUNCTION public.update_forecast_updated_at() SET search_path = public;
  END IF;
END $$;

-- Also fix any other trigger functions that might not have search_path set
-- These were identified in previous security reviews

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'update_updated_at_column' 
    AND pronamespace = 'public'::regnamespace
  ) THEN
    ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'set_updated_at' 
    AND pronamespace = 'public'::regnamespace
  ) THEN
    ALTER FUNCTION public.set_updated_at() SET search_path = public;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'audit_jobs_changes' 
    AND pronamespace = 'public'::regnamespace
  ) THEN
    ALTER FUNCTION public.audit_jobs_changes() SET search_path = public;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'audit_change_orders_changes' 
    AND pronamespace = 'public'::regnamespace
  ) THEN
    ALTER FUNCTION public.audit_change_orders_changes() SET search_path = public;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_user_email' 
    AND pronamespace = 'public'::regnamespace
  ) THEN
    ALTER FUNCTION public.get_user_email(uuid) SET search_path = public;
  END IF;
END $$;

-- Comment for documentation
COMMENT ON FUNCTION public.update_value_driver_assessments_updated_at() IS 'Trigger function to update updated_at timestamp - search_path secured';
COMMENT ON FUNCTION public.update_forecast_updated_at() IS 'Trigger function to update forecast updated_at timestamp - search_path secured';

