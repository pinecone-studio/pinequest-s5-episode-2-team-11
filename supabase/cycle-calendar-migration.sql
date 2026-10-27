-- Bloomy cycle calendar additions.
-- Reuse day_logs (already holds mood, symptoms, flow and private note) instead
-- of copying existing entries into a duplicate daily_logs table.
-- Run after schema.sql, day-logs.sql, multi-child-guardian.sql, and
-- daily-logs-migration.sql.

alter table public.day_logs
  add column if not exists pain smallint,
  add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'day_logs_pain_range_check') then
    alter table public.day_logs add constraint day_logs_pain_range_check
      check (pain is null or pain between 0 and 3);
  end if;
end $$;

-- Period dates have explicit status so guardian suggestions never count as
-- confirmed until the daughter accepts them.
create table if not exists public.period_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null,
  status text not null default 'confirmed' check (status in ('pending', 'confirmed', 'removed')),
  entered_by uuid not null references auth.users (id) on delete cascade,
  period_length smallint check (period_length is null or period_length between 2 and 7),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unique (user_id, log_date)
);

create index if not exists period_logs_user_date_idx on public.period_logs (user_id, log_date desc);
alter table public.period_logs enable row level security;
revoke all on table public.period_logs from anon, authenticated;

-- Preserve each cloud-stored last period start as a confirmed record.
insert into public.period_logs (user_id, log_date, status, entered_by, period_length, confirmed_at)
select id, last_period_start, 'confirmed', id, period_length, now()
from public.profiles
where role = 'daughter' and last_period_start is not null
on conflict (user_id, log_date) do nothing;

-- Notes remain on day_logs. This table is never readable from the client;
-- only the Node server route uses the service role to verify a PIN.
create table if not exists public.note_locks (
  user_id uuid primary key references auth.users (id) on delete cascade,
  pin_hash text not null,
  pin_salt text not null,
  failed_attempts int not null default 0 check (failed_attempts >= 0),
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.note_locks enable row level security;
revoke all on table public.note_locks from anon, authenticated;

-- Adding pain changes the get_my_day_logs return shape, so recreate it.
drop function if exists public.get_my_day_logs(date, date);
create function public.get_my_day_logs(p_from date, p_to date)
returns table(log_date date, mood smallint, pain smallint, symptoms text[], flow text, note text, share_mood boolean, updated_at timestamptz)
language sql security definer set search_path = public
as $$
  select d.log_date, d.mood, d.pain, d.symptoms, d.flow, d.note, d.share_mood, d.updated_at
  from public.day_logs d
  where d.user_id = auth.uid() and d.log_date between p_from and p_to
  order by d.log_date;
$$;
grant execute on function public.get_my_day_logs(date, date) to authenticated;
revoke all on function public.get_my_day_logs(date, date) from public, anon;

-- New pain-aware upsert; the previous overload remains for older app clients.
create or replace function public.save_my_day_log(
  p_log_date date,
  p_mood smallint,
  p_pain smallint,
  p_symptoms text[],
  p_flow text,
  p_note text,
  p_share_mood boolean
)
returns void
language plpgsql security definer set search_path = public
as $$
declare current_family uuid;
begin
  if auth.uid() is null or p_log_date > current_date then raise exception 'invalid_log_date'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'daughter') then raise exception 'daughter_only'; end if;
  if p_mood is not null and p_mood not between 1 and 5 then raise exception 'invalid_mood'; end if;
  if p_pain is not null and p_pain not between 0 and 3 then raise exception 'invalid_pain'; end if;
  if p_flow is not null and p_flow not in ('light', 'medium', 'heavy') then raise exception 'invalid_flow'; end if;
  if p_note is not null and char_length(p_note) > 500 then raise exception 'note_too_long'; end if;
  if exists (select 1 from unnest(coalesce(p_symptoms, '{}'::text[])) s where s not in ('cramps','tired','acne','bloating','breast_tenderness','headache')) then raise exception 'invalid_symptoms'; end if;
  select family_id into current_family from public.profiles where id = auth.uid();
  insert into public.day_logs(user_id, family_id, log_date, mood, pain, symptoms, flow, note, share_mood, updated_at)
  values (auth.uid(), current_family, p_log_date, p_mood, p_pain, coalesce(p_symptoms, '{}'::text[]), p_flow, nullif(p_note, ''), coalesce(p_share_mood, false), now())
  on conflict (user_id, log_date) do update set
    mood = excluded.mood, pain = excluded.pain, symptoms = excluded.symptoms,
    flow = excluded.flow, note = excluded.note, share_mood = excluded.share_mood, updated_at = now();
end $$;
grant execute on function public.save_my_day_log(date, smallint, smallint, text[], text, text, boolean) to authenticated;
revoke all on function public.save_my_day_log(date, smallint, smallint, text[], text, text, boolean) from public, anon;

create or replace function public.get_my_period_logs(p_from date, p_to date)
returns table(log_date date, status text, entered_by uuid, period_length smallint)
language sql security definer set search_path = public
as $$
  select p.log_date, p.status, p.entered_by, p.period_length
  from public.period_logs p
  where p.user_id = auth.uid() and p.log_date between p_from and p_to and p.status <> 'removed'
  order by p.log_date;
$$;

create or replace function public.get_guardian_period_logs(p_child_id uuid, p_from date, p_to date)
returns table(log_date date, status text, period_length smallint)
language sql security definer set search_path = public
as $$
  select p.log_date, p.status, p.period_length
  from public.period_logs p
  join public.profiles child on child.id = p.user_id
  join public.profiles guardian on guardian.id = auth.uid()
  where p.user_id = p_child_id and p.log_date between p_from and p_to
    and p.status <> 'removed' and child.role = 'daughter' and guardian.role = 'mother'
    and child.family_id is not null and child.family_id = guardian.family_id;
$$;

create or replace function public.sync_my_period_starts(p_dates date[], p_period_length smallint default 5)
returns void
language plpgsql security definer set search_path = public
as $$
declare start_date date;
begin
  if auth.uid() is null or not exists (select 1 from public.profiles where id = auth.uid() and role = 'daughter') then raise exception 'daughter_only'; end if;
  if coalesce(cardinality(p_dates), 0) = 0 then raise exception 'period_start_required'; end if;
  if p_period_length not between 2 and 7 then raise exception 'invalid_period_length'; end if;
  if exists (select 1 from unnest(coalesce(p_dates, '{}'::date[])) d where d > current_date) then raise exception 'invalid_log_date'; end if;
  -- Treat this RPC as the daughter's complete confirmed-date selection so
  -- calendar edits can remove old dates. Guardian pending entries stay pending.
  update public.period_logs set status = 'removed', confirmed_at = null
  where user_id = auth.uid() and status = 'confirmed' and not (log_date = any(p_dates));
  foreach start_date in array coalesce(p_dates, '{}'::date[]) loop
    insert into public.period_logs(user_id, log_date, status, entered_by, period_length, confirmed_at)
    values (auth.uid(), start_date, 'confirmed', auth.uid(), p_period_length, now())
    on conflict (user_id, log_date) do update set
      status = 'confirmed', entered_by = auth.uid(), period_length = excluded.period_length, confirmed_at = now();
  end loop;
  update public.profiles set
    last_period_start = (select max(d) from unnest(coalesce(p_dates, '{}'::date[])) d),
    period_length = p_period_length,
    cycle_length = coalesce((
      select greatest(21, least(45, round(avg(cycle_days))::int))
      from (
        select log_date - lag(log_date) over (order by log_date) as cycle_days
        from unnest(coalesce(p_dates, '{}'::date[])) as dates(log_date)
      ) lengths
      where cycle_days between 15 and 60
    ), 28),
    no_period_yet = false
  where id = auth.uid();
end $$;

create or replace function public.propose_period_start(p_child_id uuid, p_log_date date)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare v_family uuid; v_id uuid; v_name text;
begin
  if auth.uid() is null or p_log_date > current_date then raise exception 'invalid_log_date'; end if;
  select family_id into v_family from public.profiles where id = auth.uid() and role = 'mother';
  if v_family is null or not exists (select 1 from public.profiles where id = p_child_id and role = 'daughter' and family_id = v_family) then raise exception 'not_linked'; end if;
  insert into public.period_logs(user_id, log_date, status, entered_by)
  values (p_child_id, p_log_date, 'pending', auth.uid())
  on conflict (user_id, log_date) do update set
    status = case when period_logs.status = 'confirmed' then 'confirmed' else 'pending' end,
    entered_by = case when period_logs.status = 'confirmed' then period_logs.entered_by else excluded.entered_by end
  returning id into v_id;
  select display_name into v_name from public.profiles where id = auth.uid();
  if exists (select 1 from public.period_logs where id = v_id and status = 'pending') then
    insert into public.notifications(family_id, sender_id, recipient_id, recipient_role, kind, text)
    values (v_family, auth.uid(), p_child_id, 'daughter', 'period',
      coalesce(nullif(v_name, ''), 'Асран хамгаалагч') || ' сарын тэмдгийн эхэлсэн өдрийг санал болголоо. Баталгаажуулах уу?');
  end if;
  return v_id;
end $$;

create or replace function public.respond_period_entry(p_period_log_id uuid, p_approve boolean)
returns text
language plpgsql security definer set search_path = public
as $$
declare v_date date; v_length smallint;
begin
  update public.period_logs set
    status = case when p_approve then 'confirmed' else 'removed' end,
    confirmed_at = case when p_approve then now() else null end,
    period_length = case when p_approve then coalesce(period_length, (select p.period_length from public.profiles p where p.id = auth.uid())) else period_length end
  where id = p_period_log_id and user_id = auth.uid() and status = 'pending'
  returning log_date, period_length into v_date, v_length;
  if not found then raise exception 'period_request_not_found'; end if;
  if p_approve then
    update public.profiles set last_period_start = greatest(coalesce(last_period_start, v_date), v_date), no_period_yet = false where id = auth.uid();
    insert into public.notifications(family_id, sender_id, recipient_id, recipient_role, kind, text)
    select child.family_id, auth.uid(), period_log.entered_by, 'mother', 'period', 'Охин тань сарын тэмдгийн эхэлсэн өдрийг баталгаажууллаа 🌸'
    from public.period_logs period_log
    join public.profiles child on child.id = period_log.user_id
    where period_log.id = p_period_log_id;
    return 'confirmed';
  end if;
  return 'removed';
end $$;

grant execute on function public.get_my_period_logs(date, date) to authenticated;
grant execute on function public.get_guardian_period_logs(uuid, date, date) to authenticated;
grant execute on function public.sync_my_period_starts(date[], smallint) to authenticated;
grant execute on function public.propose_period_start(uuid, date) to authenticated;
grant execute on function public.respond_period_entry(uuid, boolean) to authenticated;
revoke all on function public.get_my_period_logs(date, date) from public, anon;
revoke all on function public.get_guardian_period_logs(uuid, date, date) from public, anon;
revoke all on function public.sync_my_period_starts(date[], smallint) from public, anon;
revoke all on function public.propose_period_start(uuid, date) from public, anon;
revoke all on function public.respond_period_entry(uuid, boolean) from public, anon;
