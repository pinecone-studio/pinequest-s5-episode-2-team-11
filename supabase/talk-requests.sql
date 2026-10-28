-- Bloomy · «Ярилцмаар байна»: girl-initiated talk requests + guardian's one-tap reply. Safe to re-run.
-- Server-only access (/api/talk, service role). Guardians never get a status or
-- location of the girl; she decides when to ask.

create table if not exists public.talk_requests (
  id          uuid primary key default gen_random_uuid(),
  daughter_id uuid not null references auth.users (id) on delete cascade,
  family_id   uuid not null references public.families (id) on delete cascade,
  topic       text check (topic is null or topic in ('body', 'friends', 'school', 'just')),
  reply       text check (reply is null or reply in ('now', 'later', 'tonight')),
  replied_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  replied_at  timestamptz
);
create index if not exists talk_requests_family_idx on public.talk_requests (family_id, created_at desc);

alter table public.talk_requests enable row level security;
revoke all on table public.talk_requests from anon, authenticated;

notify pgrst, 'reload schema';
