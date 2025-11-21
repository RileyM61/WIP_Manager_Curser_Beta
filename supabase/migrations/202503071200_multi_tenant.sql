-- Multi-tenant auth & company scaffolding

-- Required extensions
create extension if not exists "pgcrypto";

-- Companies table
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid references auth.users on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

-- Profiles table (maps auth user -> company & role)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users on delete cascade,
  company_id uuid references public.companies on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default timezone('utc', now())
);

-- Add company ownership to core tables
alter table public.settings add column if not exists company_id uuid references public.companies on delete cascade;
alter table public.capacity_plans add column if not exists company_id uuid references public.companies on delete cascade;
alter table public.capacity_rows add column if not exists company_id uuid references public.companies on delete cascade;
alter table public.jobs add column if not exists company_id uuid references public.companies on delete cascade;
alter table public.job_notes add column if not exists company_id uuid references public.companies on delete cascade;
alter table public.job_snapshots add column if not exists company_id uuid references public.companies on delete cascade;

-- Backfill existing data with a legacy tenant
do $$
declare legacy_company uuid;
begin
  insert into public.companies (name)
  values ('Legacy Company')
  on conflict do nothing
  returning id into legacy_company;

  if legacy_company is null then
    select id into legacy_company from public.companies limit 1;
  end if;

  update public.settings set company_id = coalesce(company_id, legacy_company);
  update public.capacity_plans set company_id = coalesce(company_id, legacy_company);
  update public.capacity_rows set company_id = coalesce(company_id, legacy_company);
  update public.jobs set company_id = coalesce(company_id, legacy_company);
  update public.job_notes set company_id = coalesce(company_id, legacy_company);
  update public.job_snapshots set company_id = coalesce(company_id, legacy_company);
end $$;

-- Enforce not-null after backfill
alter table public.settings alter column company_id set not null;
alter table public.capacity_plans alter column company_id set not null;
alter table public.capacity_rows alter column company_id set not null;
alter table public.jobs alter column company_id set not null;
alter table public.job_notes alter column company_id set not null;
alter table public.job_snapshots alter column company_id set not null;

-- Helpful indexes
create index if not exists settings_company_id_idx on public.settings (company_id);
create index if not exists capacity_plans_company_id_idx on public.capacity_plans (company_id);
create index if not exists capacity_rows_company_id_idx on public.capacity_rows (company_id);
create index if not exists jobs_company_id_idx on public.jobs (company_id);
create index if not exists job_notes_company_id_idx on public.job_notes (company_id);
create index if not exists job_snapshots_company_id_idx on public.job_snapshots (company_id);

-- Enable RLS
alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.capacity_plans enable row level security;
alter table public.capacity_rows enable row level security;
alter table public.jobs enable row level security;
alter table public.job_notes enable row level security;
alter table public.job_snapshots enable row level security;

-- Drop old public policies if they exist
drop policy if exists "public read settings" on public.settings;
drop policy if exists "service role writes settings" on public.settings;
drop policy if exists "public read capacity_plans" on public.capacity_plans;
drop policy if exists "service role writes capacity_plans" on public.capacity_plans;
drop policy if exists "public read capacity_rows" on public.capacity_rows;
drop policy if exists "service role writes capacity_rows" on public.capacity_rows;
drop policy if exists "public read jobs" on public.jobs;
drop policy if exists "service role writes jobs" on public.jobs;
drop policy if exists "public read job_notes" on public.job_notes;
drop policy if exists "service role writes job_notes" on public.job_notes;
drop policy if exists "public read snapshots" on public.job_snapshots;
drop policy if exists "service role writes snapshots" on public.job_snapshots;

-- Companies policies
create policy "companies_select"
on public.companies
for select
using (
  owner_user_id = auth.uid()
  or id in (select company_id from public.profiles where user_id = auth.uid())
);

create policy "companies_insert"
on public.companies
for insert
with check (owner_user_id = auth.uid());

create policy "companies_update"
on public.companies
for update
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

-- Profiles policies
create policy "profiles_self"
on public.profiles
for select
using (user_id = auth.uid());

create policy "profiles_upsert"
on public.profiles
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Helper predicate
create or replace function public.current_user_company_ids()
returns table (company_id uuid)
security definer
language sql
as $$
  select company_id from public.profiles where user_id = auth.uid()
$$;

-- Settings policies
create policy "settings_company_read"
on public.settings
for select
using (company_id in (select company_id from public.current_user_company_ids()));

create policy "settings_company_write"
on public.settings
for all
using (company_id in (select company_id from public.current_user_company_ids()))
with check (company_id in (select company_id from public.current_user_company_ids()));

-- Capacity plans policies
create policy "capacity_plans_company"
on public.capacity_plans
for all
using (company_id in (select company_id from public.current_user_company_ids()))
with check (company_id in (select company_id from public.current_user_company_ids()));

-- Capacity rows policies
create policy "capacity_rows_company"
on public.capacity_rows
for all
using (company_id in (select company_id from public.current_user_company_ids()))
with check (company_id in (select company_id from public.current_user_company_ids()));

-- Jobs policies
create policy "jobs_company"
on public.jobs
for all
using (company_id in (select company_id from public.current_user_company_ids()))
with check (company_id in (select company_id from public.current_user_company_ids()));

-- Job notes policies
create policy "job_notes_company"
on public.job_notes
for all
using (company_id in (select company_id from public.current_user_company_ids()))
with check (company_id in (select company_id from public.current_user_company_ids()));

-- Snapshots policies
create policy "job_snapshots_company"
on public.job_snapshots
for all
using (company_id in (select company_id from public.current_user_company_ids()))
with check (company_id in (select company_id from public.current_user_company_ids()));

