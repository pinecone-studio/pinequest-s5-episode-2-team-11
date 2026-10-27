-- Run after cycle-calendar-migration.sql. Manual calendar edits submit the
-- exact selected dates; consecutive dates are stored as one period with its
-- selected duration. Guardian pending entries are never confirmed here.

-- Users live in Asia/Ulaanbaatar (UTC+8) but Supabase runs in UTC, so
-- current_date is still "yesterday" between 00:00 and 08:00 local time and a
-- period day selected for today was rejected as a future date.
create or replace function public.bloomy_today()
returns date language sql stable
as $$ select (now() at time zone 'Asia/Ulaanbaatar')::date $$;

create or replace function public.sync_my_period_days(p_dates date[], p_period_length smallint default 5)
returns date[]
language plpgsql security definer set search_path = public
as $$
declare
  v_group record;
  v_starts date[];
  v_saved_starts date[];
begin
  if auth.uid() is null or not exists (select 1 from public.profiles where id = auth.uid() and role = 'daughter') then
    raise exception 'daughter_only';
  end if;
  if p_period_length not between 2 and 7 then raise exception 'invalid_period_length'; end if;
  if exists (select 1 from unnest(coalesce(p_dates, '{}'::date[])) d where d > public.bloomy_today()) then
    raise exception 'invalid_log_date';
  end if;

  with selected as (
    select distinct d::date as log_date
    from unnest(coalesce(p_dates, '{}'::date[])) d
  ), grouped as (
    select log_date, log_date - row_number() over (order by log_date)::int as group_key
    from selected
  ), periods as (
    select min(log_date) as start_date, count(*)::smallint as period_days
    from grouped group by group_key
  )
  select coalesce(array_agg(start_date order by start_date), '{}'::date[])
    into v_starts from periods;

  update public.period_logs
  set status = 'removed', confirmed_at = null
  where user_id = auth.uid() and status = 'confirmed' and not (log_date = any(v_starts));

  for v_group in
    with selected as (
      select distinct d::date as log_date
      from unnest(coalesce(p_dates, '{}'::date[])) d
    ), grouped as (
      select log_date, log_date - row_number() over (order by log_date)::int as group_key
      from selected
    )
    select min(log_date) as start_date, count(*)::smallint as period_days
    from grouped group by group_key order by min(log_date)
  loop
    insert into public.period_logs(user_id, log_date, status, entered_by, period_length, confirmed_at)
    values (auth.uid(), v_group.start_date, 'confirmed', auth.uid(), v_group.period_days, now())
    on conflict (user_id, log_date) do update set
      status = 'confirmed', entered_by = auth.uid(), period_length = excluded.period_length, confirmed_at = now()
    where public.period_logs.status <> 'pending';
  end loop;

  update public.profiles set
    last_period_start = (select max(log_date) from public.period_logs where user_id = auth.uid() and status = 'confirmed'),
    period_length = p_period_length,
    cycle_length = coalesce((
      select greatest(21, least(45, round(avg(cycle_days))::int))
      from (
        select log_date - lag(log_date) over (order by log_date) as cycle_days
        from public.period_logs where user_id = auth.uid() and status = 'confirmed'
      ) lengths where cycle_days between 15 and 60
    ), 28),
    no_period_yet = not exists (select 1 from public.period_logs where user_id = auth.uid() and status = 'confirmed')
  where id = auth.uid();

  select coalesce(array_agg(log_date order by log_date), '{}'::date[])
    into v_saved_starts
  from public.period_logs where user_id = auth.uid() and status = 'confirmed';
  return v_saved_starts;
end $$;

alter table public.period_logs drop constraint if exists period_logs_period_length_check;
alter table public.period_logs add constraint period_logs_period_length_check
  check (period_length is null or period_length between 1 and 31);

-- Same timezone fix for the legacy start-date sync used by "today it started".
do $$
declare v_def text;
begin
  select pg_get_functiondef('public.sync_my_period_starts(date[], smallint)'::regprocedure) into v_def;
  if v_def like '%> current_date%' then
    execute replace(v_def, '> current_date', '> public.bloomy_today()');
  end if;
exception when undefined_function then null;
end $$;

grant execute on function public.bloomy_today() to authenticated;
grant execute on function public.sync_my_period_days(date[], smallint) to authenticated;
revoke all on function public.sync_my_period_days(date[], smallint) from public, anon;
