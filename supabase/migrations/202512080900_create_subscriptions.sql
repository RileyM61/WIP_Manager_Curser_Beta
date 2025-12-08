create table if not exists public.subscriptions (
  id text primary key,
  user_id uuid references auth.users not null,
  status text check (status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid')),
  price_id text,
  quantity integer,
  cancel_at_period_end boolean,
  created timestamp with time zone default timezone('utc'::text, now()) not null,
  current_period_start timestamp with time zone default timezone('utc'::text, now()) not null,
  current_period_end timestamp with time zone default timezone('utc'::text, now()) not null,
  ended_at timestamp with time zone default timezone('utc'::text, now()),
  cancel_at timestamp with time zone default timezone('utc'::text, now()),
  canceled_at timestamp with time zone default timezone('utc'::text, now()),
  trial_start timestamp with time zone default timezone('utc'::text, now()),
  trial_end timestamp with time zone default timezone('utc'::text, now())
);

alter table public.subscriptions enable row level security;

create policy "Can read own subscription data." on public.subscriptions for select using (auth.uid() = user_id);

-- Create a secure schema for Stripe webhooks if it doesn't exist
create schema if not exists stripe;
grant usage on schema stripe to service_role;
grant all on public.subscriptions to service_role;
