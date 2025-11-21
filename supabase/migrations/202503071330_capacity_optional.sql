-- Optional capacity planning toggle

-- Allow settings to exist without a capacity plan and track enablement state
alter table public.settings
  add column if not exists capacity_enabled boolean not null default false;

alter table public.settings
  alter column capacity_plan_id drop not null;

-- Ensure there is exactly one settings row per company (drop old singleton index)
drop index if exists settings_singleton_idx;
create unique index if not exists settings_company_unique on public.settings (company_id);

