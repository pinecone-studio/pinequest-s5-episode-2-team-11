-- Existing day_logs is reused for the daughter's private daily log.
-- Run after day-logs.sql. Legacy values stay available to the database owner.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'day_logs' and column_name = 'symptoms'
      and data_type = 'text'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'day_logs' and column_name = 'legacy_symptoms'
  ) then
    alter table public.day_logs rename column symptoms to legacy_symptoms;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'day_logs' and column_name = 'period'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'day_logs' and column_name = 'legacy_period'
  ) then
    alter table public.day_logs rename column period to legacy_period;
  end if;
end $$;

alter table public.day_logs add column if not exists mood smallint;
alter table public.day_logs add column if not exists symptoms text[] not null default '{}';
alter table public.day_logs add column if not exists flow text;
alter table public.day_logs add column if not exists note text;
alter table public.day_logs add column if not exists share_mood boolean not null default false;
alter table public.day_logs add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'day_logs_mood_range_check') then
    alter table public.day_logs add constraint day_logs_mood_range_check check (mood is null or mood between 1 and 5);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'day_logs_flow_check') then
    alter table public.day_logs add constraint day_logs_flow_check check (flow is null or flow in ('light', 'medium', 'heavy'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'day_logs_note_length_check') then
    alter table public.day_logs add constraint day_logs_note_length_check check (note is null or char_length(note) <= 500);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'day_logs_symptom_keys_check') then
    alter table public.day_logs add constraint day_logs_symptom_keys_check check (
      symptoms <@ array['cramps','tired','acne','bloating','breast_tenderness','headache']::text[]
    );
  end if;
end $$;

-- Preserve existing mood/flow/symptom choices, mapping them to the new format.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='day_logs' and column_name='emotion')
     and exists (select 1 from information_schema.columns where table_schema='public' and table_name='day_logs' and column_name='legacy_symptoms') then
    update public.day_logs d set
      mood = coalesce(d.mood, case d.emotion
        when 'Happy' then 5 when 'Calm' then 4 when 'Sad' then 2
        when 'Anxious' then 2 when 'Embarrassed' then 3 when 'Irritable' then 2 else null end),
      symptoms = case when cardinality(d.symptoms) > 0 then d.symptoms else
        case d.legacy_symptoms
          when 'Cramps' then array['cramps']::text[]
          when 'Fatigue' then array['tired']::text[]
          when 'Spots' then array['acne']::text[]
          when 'Bloating' then array['bloating']::text[]
          when 'Tenderness' then array['breast_tenderness']::text[]
          when 'Headache' then array['headache']::text[]
          else '{}'::text[] end
        end,
      flow = coalesce(d.flow, case d.legacy_period
        when 'Light' then 'light' when 'Medium' then 'medium' when 'Heavy' then 'heavy'
        when 'Spotting' then 'light' else null end),
      share_mood = case when d.mood is null and d.emotion is not null then coalesce(p.share_mood, false) else d.share_mood end
    from public.profiles p where p.id = d.user_id;
  end if;
end $$;

-- Consolidate the legacy mood-only table into day_logs before retiring its
-- direct authenticated access. Existing daily_log values take precedence.
insert into public.day_logs as existing(user_id, family_id, log_date, mood, share_mood, updated_at)
select m.user_id, m.family_id, m.log_date,
  case m.mood
    when 'sad' then 1 when '😭' then 1
    when 'angry' then 2 when '😡' then 2
    when 'tired' then 3 when '😴' then 3
    when 'craving' then 3 when '🍫' then 3
    else null
  end,
  coalesce(p.share_mood, false), coalesce(m.created_at, now())
from public.mood_logs m
left join public.profiles p on p.id = m.user_id
where m.mood in ('sad','😭','angry','😡','tired','😴','craving','🍫')
on conflict (user_id, log_date) do update set
  mood = coalesce(existing.mood, excluded.mood),
  share_mood = existing.share_mood or excluded.share_mood;

alter table public.day_logs enable row level security;
drop policy if exists "day_logs: read own or shared" on public.day_logs;
drop policy if exists "day_logs: read own" on public.day_logs;
create policy "day_logs: read own" on public.day_logs
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "day_logs: insert own" on public.day_logs;
create policy "day_logs: insert own" on public.day_logs
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "day_logs: update own" on public.day_logs;
create policy "day_logs: update own" on public.day_logs
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "day_logs: delete own" on public.day_logs;
create policy "day_logs: delete own" on public.day_logs
  for delete to authenticated using (user_id = auth.uid());

-- No authenticated user can query the table directly. Daughter read/write and
-- guardian mood-only access go through the narrowly scoped RPCs below.
revoke all on table public.day_logs from anon, authenticated;

drop policy if exists "mood: read own or shared" on public.mood_logs;
drop policy if exists "mood: read own" on public.mood_logs;
create policy "mood: read own" on public.mood_logs
  for select to authenticated using (user_id = auth.uid());
revoke all on table public.mood_logs from anon, authenticated;

create or replace function public.get_my_day_logs(p_from date, p_to date)
returns table(log_date date, mood smallint, symptoms text[], flow text, note text, share_mood boolean, updated_at timestamptz)
language sql security definer set search_path = public
as $$
  select d.log_date, d.mood, d.symptoms, d.flow, d.note, d.share_mood, d.updated_at
  from public.day_logs d
  where d.user_id = auth.uid() and d.log_date between p_from and p_to
  order by d.log_date;
$$;

create or replace function public.save_my_day_log(
  p_log_date date,
  p_mood smallint,
  p_symptoms text[],
  p_flow text,
  p_note text,
  p_share_mood boolean
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  current_family uuid;
begin
  if auth.uid() is null or p_log_date > current_date then raise exception 'invalid_log_date'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'daughter') then raise exception 'daughter_only'; end if;
  if p_mood is not null and p_mood not between 1 and 5 then raise exception 'invalid_mood'; end if;
  if p_flow is not null and p_flow not in ('light', 'medium', 'heavy') then raise exception 'invalid_flow'; end if;
  if p_note is not null and char_length(p_note) > 500 then raise exception 'note_too_long'; end if;
  if exists (select 1 from unnest(coalesce(p_symptoms, '{}'::text[])) s where s not in ('cramps','tired','acne','bloating','breast_tenderness','headache')) then raise exception 'invalid_symptoms'; end if;
  select family_id into current_family from public.profiles where id = auth.uid();
  insert into public.day_logs(user_id, family_id, log_date, mood, symptoms, flow, note, share_mood, updated_at)
  values (auth.uid(), current_family, p_log_date, p_mood, coalesce(p_symptoms, '{}'::text[]), p_flow, nullif(p_note, ''), coalesce(p_share_mood, false), now())
  on conflict (user_id, log_date) do update set
    mood = excluded.mood, symptoms = excluded.symptoms, flow = excluded.flow,
    note = excluded.note, share_mood = excluded.share_mood, updated_at = now();
end $$;

create or replace function public.delete_my_day_log(p_log_date date)
returns void
language sql security definer set search_path = public
as $$ delete from public.day_logs where user_id = auth.uid() and log_date = p_log_date; $$;

create or replace function public.set_my_day_mood(p_log_date date, p_mood smallint)
returns void
language plpgsql security definer set search_path = public
as $$
declare current_family uuid;
begin
  if auth.uid() is null or p_log_date > current_date then raise exception 'invalid_log_date'; end if;
  if p_mood is not null and p_mood not between 1 and 5 then raise exception 'invalid_mood'; end if;
  select family_id into current_family from public.profiles where id = auth.uid() and role = 'daughter';
  if not found then raise exception 'daughter_only'; end if;
  insert into public.day_logs(user_id, family_id, log_date, mood, symptoms, share_mood, updated_at)
  values (auth.uid(), current_family, p_log_date, p_mood, '{}', false, now())
  on conflict (user_id, log_date) do update set mood = excluded.mood, updated_at = now();
end $$;

create or replace function public.clear_my_day_mood(p_log_date date)
returns void
language sql security definer set search_path = public
as $$ update public.day_logs set mood = null, share_mood = false, updated_at = now() where user_id = auth.uid() and log_date = p_log_date; $$;

create or replace function public.get_shared_daily_moods(p_child_id uuid, p_from date, p_to date)
returns table(log_date date, mood smallint)
language sql security definer set search_path = public
as $$
  select d.log_date, d.mood
  from public.day_logs d
  join public.profiles child on child.id = d.user_id
  join public.profiles guardian on guardian.id = auth.uid()
  where d.user_id = p_child_id
    and d.log_date between p_from and p_to
    and d.share_mood = true
    and child.share_mood = true
    and child.role = 'daughter'
    and guardian.role = 'mother'
    and child.family_id = guardian.family_id
    and child.family_id is not null;
$$;

grant execute on function public.get_my_day_logs(date, date) to authenticated;
grant execute on function public.save_my_day_log(date, smallint, text[], text, text, boolean) to authenticated;
grant execute on function public.delete_my_day_log(date) to authenticated;
grant execute on function public.set_my_day_mood(date, smallint) to authenticated;
grant execute on function public.clear_my_day_mood(date) to authenticated;
grant execute on function public.get_shared_daily_moods(uuid, date, date) to authenticated;

revoke all on function public.get_my_day_logs(date, date) from public, anon;
revoke all on function public.save_my_day_log(date, smallint, text[], text, text, boolean) from public, anon;
revoke all on function public.delete_my_day_log(date) from public, anon;
revoke all on function public.set_my_day_mood(date, smallint) from public, anon;
revoke all on function public.clear_my_day_mood(date) from public, anon;
revoke all on function public.get_shared_daily_moods(uuid, date, date) from public, anon;
