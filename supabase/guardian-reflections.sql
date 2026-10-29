-- Bloomy · Ням гарагийн эргэцүүлэл (зөвхөн асран хамгаалагч өөрөө). Safe to re-run.
-- Never visible to the daughter: every policy requires guardian_id = auth.uid() AND role = 'mother'.

create table if not exists public.guardian_reflections (
  id          uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references auth.users (id) on delete cascade,
  week_start  date not null, -- Monday of the week (Asia/Ulaanbaatar)
  listened    text check (listened is null or listened in ('yes', 'sometimes', 'no')),
  warm        text check (warm is null or warm in ('yes', 'sometimes', 'no')),
  goal        text check (goal is null or char_length(goal) <= 200),
  created_at  timestamptz not null default now(),
  unique (guardian_id, week_start)
);

alter table public.guardian_reflections enable row level security;
revoke all on table public.guardian_reflections from anon;
grant select, insert, update on table public.guardian_reflections to authenticated;

drop policy if exists "reflections: guardian own" on public.guardian_reflections;
create policy "reflections: guardian own" on public.guardian_reflections
  for all to authenticated
  using (guardian_id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'mother'))
  with check (guardian_id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'mother'));

notify pgrst, 'reload schema';
