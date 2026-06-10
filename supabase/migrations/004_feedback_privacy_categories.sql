alter table public.feedback_submissions
drop constraint if exists feedback_submissions_category_check;

alter table public.feedback_submissions
add constraint feedback_submissions_category_check
check (
  category in (
    'bug',
    'idea',
    'quality',
    'confusing',
    'privacy_access',
    'privacy_correction',
    'privacy_erasure',
    'consent_withdrawal',
    'grievance',
    'other'
  )
);
