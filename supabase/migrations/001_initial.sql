create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  steps jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  tool_name text not null,
  file_size_bytes bigint not null,
  duration_ms integer not null,
  ai_tokens_used integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_workflows_user_id on public.workflows (user_id);
create index if not exists idx_usage_logs_created_at on public.usage_logs (created_at);
create index if not exists idx_usage_logs_user_id on public.usage_logs (user_id);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_workflows_updated_at on public.workflows;
create trigger set_workflows_updated_at
before update on public.workflows
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.workflows enable row level security;
alter table public.usage_logs enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "workflows_select_own" on public.workflows;
create policy "workflows_select_own"
on public.workflows
for select
using (auth.uid() = user_id);

drop policy if exists "workflows_insert_own" on public.workflows;
create policy "workflows_insert_own"
on public.workflows
for insert
with check (auth.uid() = user_id);

drop policy if exists "workflows_update_own" on public.workflows;
create policy "workflows_update_own"
on public.workflows
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "workflows_delete_own" on public.workflows;
create policy "workflows_delete_own"
on public.workflows
for delete
using (auth.uid() = user_id);

drop policy if exists "usage_logs_insert_service_role" on public.usage_logs;
create policy "usage_logs_insert_service_role"
on public.usage_logs
for insert
with check (auth.role() = 'service_role');
