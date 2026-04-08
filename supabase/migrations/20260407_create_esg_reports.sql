-- Create ESG reports table with user-scoped access controls.
create extension if not exists pgcrypto;

create table if not exists public.esg_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  environmental_score numeric,
  social_score numeric,
  governance_score numeric,
  total_score numeric,
  data jsonb,
  created_at timestamp with time zone not null default now()
);

alter table public.esg_reports enable row level security;

drop policy if exists "Users can insert their own ESG reports" on public.esg_reports;
create policy "Users can insert their own ESG reports"
on public.esg_reports
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can read their own ESG reports" on public.esg_reports;
create policy "Users can read their own ESG reports"
on public.esg_reports
for select
using (auth.uid() = user_id);
