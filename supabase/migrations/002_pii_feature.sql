-- Add PII detection tracking to usage_logs
alter table public.usage_logs
  add column if not exists pii_detections_count integer;

-- New table: user_preferences
create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  theme text not null default 'light',
  dismissed_privacy_badge boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_preferences'
      and policyname = 'user_own_preferences'
  ) then
    create policy "user_own_preferences"
      on public.user_preferences
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end;
$$;

drop trigger if exists set_user_preferences_updated_at on public.user_preferences;
create trigger set_user_preferences_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();
