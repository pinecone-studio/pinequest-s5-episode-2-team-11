-- Bloomy · Өдрийн цагтай бүртгэл (өглөө / орой). Зөвхөн охин өөрөө.
-- Run after cycle-calendar-migration.sql and private-note-lock-migration.sql. Safe to re-run.
--
-- log_entries is the source of truth for the day view. Every write is rolled
-- up into the existing one-row-per-day public.day_logs (mood, pain, symptoms,
-- flow) by a trigger, so get_my_day_logs, guardian mood sharing
-- (get_shared_daily_moods + share_mood) and older screens keep working.
-- Private note text never goes into log_entries: it stays in day_logs.note
-- behind the PIN route (/api/private-notes). Guardians get no access at all.

create or replace function public.bloomy_today()
returns date language sql stable
as $$ select (now() at time zone 'Asia/Ulaanbaatar')::date $$;
grant execute on function public.bloomy_today() to authenticated;

create table if not exists public.log_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  log_date   date not null,
  category   text not null check (category in ('mood', 'skin', 'symptoms', 'period', 'sleep', 'note')),
  value      jsonb not null,
  logged_at  timestamptz not null default now()
);
create index if not exists log_entries_user_date_idx on public.log_entries (user_id, log_date, logged_at);

-- Spotting is a new flow option.
alter table public.day_logs drop constraint if exists day_logs_flow_check;
alter table public.day_logs add constraint day_logs_flow_check
  check (flow is null or flow in ('light', 'medium', 'heavy', 'spotting'));

create or replace function public.log_entry_value_ok(p_category text, p_value jsonb)
returns boolean language sql immutable
as $$
  select case p_category
    when 'mood' then jsonb_typeof(p_value->'mood') = 'number' and (p_value->>'mood')::numeric in (1, 2, 3, 4, 5)
    when 'skin' then jsonb_typeof(p_value->'items') = 'array' and jsonb_array_length(p_value->'items') between 1 and 5
      and (p_value->'items') <@ '["oily","dry","pimples","sensitive","normal"]'::jsonb
    when 'symptoms' then jsonb_typeof(p_value->'items') = 'array'
      and (p_value->'items') <@ '["cramps","tired","bloating","breast_tenderness","headache"]'::jsonb
      and (p_value->'pain' is null or jsonb_typeof(p_value->'pain') = 'null'
        or (jsonb_typeof(p_value->'pain') = 'number' and (p_value->>'pain')::numeric in (0, 1, 2, 3)))
      and (jsonb_array_length(p_value->'items') > 0 or jsonb_typeof(p_value->'pain') = 'number')
    when 'period' then p_value->>'flow' in ('light', 'medium', 'heavy', 'spotting')
    when 'sleep' then jsonb_typeof(p_value->'hours') = 'number' and (p_value->>'hours')::numeric between 4 and 12
      and ((p_value->>'hours')::numeric * 2) = round((p_value->>'hours')::numeric * 2)
      and p_value->>'quality' in ('good', 'ok', 'bad')
    -- Note text lives in day_logs.note behind the PIN, never here.
    else false
  end
$$;

-- Recomputes the day_logs summary for one day from that day's entries.
create or replace function public.rollup_day_log(p_user uuid, p_date date)
returns void language plpgsql security definer set search_path = public
as $$
declare
  v_mood smallint;
  v_pain smallint;
  v_symptoms text[];
  v_flow text;
begin
  select (value->>'mood')::smallint into v_mood from public.log_entries
  where user_id = p_user and log_date = p_date and category = 'mood' order by logged_at desc limit 1;
  select max((value->>'pain')::smallint) into v_pain from public.log_entries
  where user_id = p_user and log_date = p_date and category = 'symptoms' and jsonb_typeof(value->'pain') = 'number';
  -- Pimples are logged under skin now; the forecast still calls them "acne".
  select coalesce(array_agg(distinct item order by item), '{}'::text[]) into v_symptoms from (
    select jsonb_array_elements_text(value->'items') as item from public.log_entries
    where user_id = p_user and log_date = p_date and category = 'symptoms'
    union
    select 'acne' from public.log_entries
    where user_id = p_user and log_date = p_date and category = 'skin' and value->'items' ? 'pimples'
  ) items;
  select value->>'flow' into v_flow from public.log_entries
  where user_id = p_user and log_date = p_date and category = 'period' order by logged_at desc limit 1;

  insert into public.day_logs (user_id, family_id, log_date, mood, pain, symptoms, flow, updated_at)
  values (p_user, (select family_id from public.profiles where id = p_user), p_date, v_mood, v_pain, v_symptoms, v_flow, now())
  on conflict (user_id, log_date) do update set
    mood = excluded.mood, pain = excluded.pain, symptoms = excluded.symptoms, flow = excluded.flow, updated_at = now();
end $$;
revoke all on function public.rollup_day_log(uuid, date) from public, anon, authenticated;

create or replace function public.log_entries_check()
returns trigger language plpgsql set search_path = public
as $$
begin
  if new.log_date > public.bloomy_today() then raise exception 'future_log_date'; end if;
  if not public.log_entry_value_ok(new.category, new.value) then raise exception 'invalid_log_value'; end if;
  return new;
end $$;

create or replace function public.log_entries_rollup()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then perform public.rollup_day_log(old.user_id, old.log_date); end if;
  if tg_op in ('INSERT', 'UPDATE') then perform public.rollup_day_log(new.user_id, new.log_date); end if;
  return null;
end $$;

drop trigger if exists log_entries_check on public.log_entries;
create trigger log_entries_check before insert or update on public.log_entries
  for each row execute function public.log_entries_check();
drop trigger if exists log_entries_rollup on public.log_entries;
create trigger log_entries_rollup after insert or update or delete on public.log_entries
  for each row execute function public.log_entries_rollup();

-- RLS: the daughter can CRUD her own rows; guardians have no policy at all.
alter table public.log_entries enable row level security;
revoke all on table public.log_entries from anon;
grant select, insert, update, delete on table public.log_entries to authenticated;

drop policy if exists "log_entries: daughter reads own" on public.log_entries;
create policy "log_entries: daughter reads own" on public.log_entries
  for select to authenticated
  using (user_id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'daughter'));
drop policy if exists "log_entries: daughter inserts own" on public.log_entries;
create policy "log_entries: daughter inserts own" on public.log_entries
  for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'daughter'));
drop policy if exists "log_entries: daughter updates own" on public.log_entries;
create policy "log_entries: daughter updates own" on public.log_entries
  for update to authenticated
  using (user_id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'daughter'))
  with check (user_id = auth.uid());
drop policy if exists "log_entries: daughter deletes own" on public.log_entries;
create policy "log_entries: daughter deletes own" on public.log_entries
  for delete to authenticated
  using (user_id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'daughter'));

-- Note and per-day sharing are set separately so a category save never touches them.
create or replace function public.save_my_day_note(p_log_date date, p_note text)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null or not exists (select 1 from public.profiles where id = auth.uid() and role = 'daughter') then
    raise exception 'daughter_only';
  end if;
  if p_log_date > public.bloomy_today() then raise exception 'invalid_log_date'; end if;
  insert into public.day_logs (user_id, family_id, log_date, note, updated_at)
  values (auth.uid(), (select family_id from public.profiles where id = auth.uid()), p_log_date, nullif(left(trim(p_note), 500), ''), now())
  on conflict (user_id, log_date) do update set note = excluded.note, updated_at = now();
end $$;

create or replace function public.set_my_day_share_mood(p_log_date date, p_share boolean)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null or not exists (select 1 from public.profiles where id = auth.uid() and role = 'daughter') then
    raise exception 'daughter_only';
  end if;
  if p_log_date > public.bloomy_today() then raise exception 'invalid_log_date'; end if;
  insert into public.day_logs (user_id, family_id, log_date, share_mood, updated_at)
  values (auth.uid(), (select family_id from public.profiles where id = auth.uid()), p_log_date, coalesce(p_share, false), now())
  on conflict (user_id, log_date) do update set share_mood = excluded.share_mood, updated_at = now();
end $$;

grant execute on function public.save_my_day_note(date, text) to authenticated;
grant execute on function public.set_my_day_share_mood(date, boolean) to authenticated;
revoke all on function public.save_my_day_note(date, text) from public, anon;
revoke all on function public.set_my_day_share_mood(date, boolean) from public, anon;

-- One-time copy of existing day_logs into entries (evening of that day), only
-- for days that have no entries yet.
do $$
declare
  d record;
  v_at timestamptz;
  v_symptoms text[];
begin
  for d in
    select * from public.day_logs dl
    where not exists (select 1 from public.log_entries e where e.user_id = dl.user_id and e.log_date = dl.log_date)
      and exists (select 1 from public.profiles p where p.id = dl.user_id and p.role = 'daughter')
  loop
    v_at := (d.log_date + time '20:00') at time zone 'Asia/Ulaanbaatar';
    v_symptoms := array(select unnest(coalesce(d.symptoms, '{}'::text[])) except select 'acne');
    if d.mood between 1 and 5 then
      insert into public.log_entries (user_id, log_date, category, value, logged_at)
      values (d.user_id, d.log_date, 'mood', jsonb_build_object('mood', d.mood), v_at);
    end if;
    if cardinality(v_symptoms) > 0 or d.pain is not null then
      insert into public.log_entries (user_id, log_date, category, value, logged_at)
      values (d.user_id, d.log_date, 'symptoms', jsonb_build_object('pain', d.pain, 'items', to_jsonb(v_symptoms)), v_at);
    end if;
    if 'acne' = any(coalesce(d.symptoms, '{}'::text[])) then
      insert into public.log_entries (user_id, log_date, category, value, logged_at)
      values (d.user_id, d.log_date, 'skin', '{"items":["pimples"]}'::jsonb, v_at);
    end if;
    if d.flow is not null then
      insert into public.log_entries (user_id, log_date, category, value, logged_at)
      values (d.user_id, d.log_date, 'period', jsonb_build_object('flow', d.flow), v_at);
    end if;
  end loop;
end $$;

notify pgrst, 'reload schema';
