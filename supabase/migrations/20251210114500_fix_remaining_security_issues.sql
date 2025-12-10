-- Fix search_path for ensure_single_current_valuation
ALTER FUNCTION public.ensure_single_current_valuation() SET search_path = public;

-- Note: The "Leaked Password Protection Disabled" warning cannot be fixed via SQL migration.
-- You must enable it in the Supabase Dashboard:
-- Go to Authentication -> Security -> Advanced Security Features -> Enable "Passowrd Strength Checks" or similar options if available.
-- Or specifically "Block leaked passwords" in the Auth settings.
