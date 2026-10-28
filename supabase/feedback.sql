-- Bloomy · Санал хүсэлт (охин, асран хамгаалагч, нэг товшилтын micro feedback). Safe to re-run.
-- Anonymous in analysis: user_id is only for de-duplication and timing; the
-- admin page (/api/admin/feedback, service role) never returns it.
-- Writes go through /api/feedback (service role, validated). From the client a
-- user can only read her own feedback_state; nobody can read feedback rows.

create table if not exists public.feedback_surveys (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  role        text not null check (role in ('daughter', 'guardian')),
  answers     jsonb not null,
  app_version text,
  created_at  timestamptz default now()
);
create index if not exists feedback_surveys_created_idx on public.feedback_surveys (role, created_at desc);

create table if not exists public.feedback_micro (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  target_type text not null check (target_type in ('bloomy_answer', 'lesson', 'forecast', 'sos')),
  target_id   text not null check (char_length(target_id) <= 120),
  value       text not null check (value in ('up', 'down', 'yes', 'no')),
  created_at  timestamptz default now(),
  unique (user_id, target_type, target_id)
);
create index if not exists feedback_micro_created_idx on public.feedback_micro (target_type, created_at desc);

create table if not exists public.feedback_state (
  user_id           uuid primary key,
  first_seen_at     timestamptz default now(),
  last_prompted_at  timestamptz,
  last_submitted_at timestamptz,
  dismiss_count     int default 0,
  hard_day          date -- Ulaanbaatar date a safety card was shown (no survey that day)
);

alter table public.feedback_surveys enable row level security;
alter table public.feedback_micro enable row level security;
alter table public.feedback_state enable row level security;
revoke all on table public.feedback_surveys, public.feedback_micro, public.feedback_state from anon, authenticated;
grant select on table public.feedback_state to authenticated;

drop policy if exists "feedback_state: read own" on public.feedback_state;
create policy "feedback_state: read own" on public.feedback_state
  for select to authenticated using (user_id = auth.uid());

notify pgrst, 'reload schema';
