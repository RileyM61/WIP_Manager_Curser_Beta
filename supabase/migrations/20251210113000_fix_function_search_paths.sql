ALTER FUNCTION public.update_cfo_pro_applications_updated_at() SET search_path = public;
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.get_managed_companies(uuid) SET search_path = public;
ALTER FUNCTION public.create_managed_company(text, uuid, uuid, text, jsonb, text) SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.current_user_company_ids() SET search_path = public;
ALTER FUNCTION public.update_valuations_updated_at() SET search_path = public;
