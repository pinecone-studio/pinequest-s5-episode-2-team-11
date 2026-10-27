-- Bloomy · Хувийн мөчлөгийн таамгийн кэш (зөвхөн охин өөрөө).
-- Run after cycle-calendar-migration.sql. Safe to re-run.
-- One generated text per (daughter, cycle start, day label) so the AI is
-- called at most once per day label per cycle. Guardians never get access:
-- every policy requires user_id = auth.uid() AND the caller is a daughter.

create table if not exists public.forecast_cache (
  user_id     uuid not null references auth.users (id) on delete cascade,
  cycle_start date not null,
  day_label   text not null check (day_label ~ '^(pre(_[1-5])?|period_day_([1-9]|1[0-4]))$'),
  text        text not null check (char_length(text) <= 400),
  tip         text not null check (char_length(tip) <= 60),
  source      text not null default 'ai' check (source in ('ai', 'template')),
  created_at  timestamptz not null default now(),
  primary key (user_id, cycle_start, day_label)
);

alter table public.forecast_cache enable row level security;
revoke all on table public.forecast_cache from anon;
grant select, insert, update, delete on table public.forecast_cache to authenticated;

drop policy if exists "forecast_cache: daughter reads own" on public.forecast_cache;
create policy "forecast_cache: daughter reads own" on public.forecast_cache
  for select to authenticated
  using (user_id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'daughter'));

drop policy if exists "forecast_cache: daughter writes own" on public.forecast_cache;
create policy "forecast_cache: daughter writes own" on public.forecast_cache
  for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'daughter'));

drop policy if exists "forecast_cache: daughter updates own" on public.forecast_cache;
create policy "forecast_cache: daughter updates own" on public.forecast_cache
  for update to authenticated
  using (user_id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'daughter'))
  with check (user_id = auth.uid());

drop policy if exists "forecast_cache: daughter deletes own" on public.forecast_cache;
create policy "forecast_cache: daughter deletes own" on public.forecast_cache
  for delete to authenticated
  using (user_id = auth.uid());
