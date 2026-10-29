-- Bloomy · «Ээжийн түүх»: guardian's story for her daughter (audio or text). Safe to re-run.
-- Audio lives in a PRIVATE bucket; it is only ever served through 5-minute
-- signed URLs from /api/stories to that guardian and that daughter.
-- No client policies: every read/write goes through the server (service role).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('guardian-stories', 'guardian-stories', false, 6291456,
        array['audio/webm', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/mpeg', 'audio/x-m4a'])
on conflict (id) do update set public = false;

create table if not exists public.guardian_stories (
  id           uuid primary key default gen_random_uuid(),
  guardian_id  uuid not null references auth.users (id) on delete cascade,
  daughter_id  uuid not null references auth.users (id) on delete cascade,
  family_id    uuid references public.families (id) on delete cascade,
  kind         text not null check (kind in ('audio', 'text')),
  body         text check (body is null or char_length(body) <= 1500),
  audio_path   text,
  duration_sec smallint check (duration_sec is null or duration_sec between 1 and 120),
  hidden       boolean not null default false, -- the daughter chose «Нуух»
  created_at   timestamptz not null default now(),
  check ((kind = 'audio' and audio_path is not null) or (kind = 'text' and body is not null))
);
create index if not exists guardian_stories_daughter_idx on public.guardian_stories (daughter_id, created_at desc);

alter table public.guardian_stories enable row level security;
revoke all on table public.guardian_stories from anon, authenticated;

notify pgrst, 'reload schema';
