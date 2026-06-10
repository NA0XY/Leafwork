create table if not exists public.feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  category text not null check (category in ('bug', 'idea', 'quality', 'confusing', 'privacy_access', 'privacy_correction', 'privacy_erasure', 'consent_withdrawal', 'grievance', 'other')),
  message text not null check (char_length(message) between 10 and 2000),
  email text check (email is null or char_length(email) <= 255),
  rating smallint check (rating is null or rating between 1 and 5),
  page_path text not null default '',
  user_agent text,
  status text not null default 'new' check (status in ('new', 'reviewed', 'planned', 'closed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_feedback_submissions_created_at on public.feedback_submissions (created_at desc);
create index if not exists idx_feedback_submissions_status on public.feedback_submissions (status);
create index if not exists idx_feedback_submissions_user_id on public.feedback_submissions (user_id);

grant select, insert, update, delete on public.feedback_submissions to service_role;

alter table public.feedback_submissions enable row level security;

drop policy if exists "feedback_submissions_service_role_all" on public.feedback_submissions;
create policy "feedback_submissions_service_role_all"
on public.feedback_submissions
for all
to service_role
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
