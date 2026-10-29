-- Allow a linked guardian to edit only their daughter's confirmed period days.
-- Run this migration in the Supabase SQL editor before using the calendar editor.
create or replace function public.sync_guardian_period_days(
  p_child_id uuid,
  p_dates date[],
  p_period_length smallint default 5
)
returns date[]
language plpgsql security definer set search_path = public
as $$
declare
  v_group record;
  v_starts date[];
  v_today date := (now() at time zone 'Asia/Ulaanbaatar')::date;
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles guardian
    join public.profiles child on child.family_id = guardian.family_id
    where guardian.id = auth.uid() and guardian.role = 'mother'
      and child.id = p_child_id and child.role = 'daughter'
      and guardian.family_id is not null
  ) then raise exception 'not_linked'; end if;
  if p_period_length not between 2 and 7 then raise exception 'invalid_period_length'; end if;
  if exists (select 1 from unnest(coalesce(p_dates, '{}'::date[])) d where d > v_today) then
    raise exception 'invalid_log_date';
  end if;

  with selected as (
    select distinct d::date as log_date from unnest(coalesce(p_dates, '{}'::date[])) d
  ), grouped as (
    select log_date, log_date - row_number() over (order by log_date)::int as group_key from selected
  ), periods as (
    select min(log_date) as start_date from grouped group by group_key
  )
  select coalesce(array_agg(start_date order by start_date), '{}'::date[]) into v_starts from periods;

  if exists (
    select 1 from public.period_logs p
    where p.user_id = p_child_id and p.status = 'pending' and p.log_date = any(v_starts)
  ) then raise exception 'period_request_conflict'; end if;

  update public.period_logs set status = 'removed', confirmed_at = null
  where user_id = p_child_id and status = 'confirmed' and not (log_date = any(v_starts));

  for v_group in
    with selected as (
      select distinct d::date as log_date from unnest(coalesce(p_dates, '{}'::date[])) d
    ), grouped as (
      select log_date, log_date - row_number() over (order by log_date)::int as group_key from selected
    )
    select min(log_date) as start_date, count(*)::smallint as period_days
    from grouped group by group_key order by min(log_date)
  loop
    insert into public.period_logs(user_id, log_date, status, entered_by, period_length, confirmed_at)
    values (p_child_id, v_group.start_date, 'confirmed', auth.uid(), v_group.period_days, now())
    on conflict (user_id, log_date) do update set
      status = 'confirmed', entered_by = auth.uid(), period_length = excluded.period_length, confirmed_at = now()
    where public.period_logs.status <> 'pending';
  end loop;

  update public.profiles set
    last_period_start = (select max(log_date) from public.period_logs where user_id = p_child_id and status = 'confirmed'),
    period_length = p_period_length,
    cycle_length = coalesce((
      select greatest(21, least(45, round(avg(cycle_days))::int)) from (
        select log_date - lag(log_date) over (order by log_date) as cycle_days
        from public.period_logs where user_id = p_child_id and status = 'confirmed'
      ) lengths where cycle_days between 15 and 60
    ), 28),
    no_period_yet = not exists (select 1 from public.period_logs where user_id = p_child_id and status = 'confirmed')
  where id = p_child_id;

  return v_starts;
end $$;

grant execute on function public.sync_guardian_period_days(uuid, date[], smallint) to authenticated;
revoke all on function public.sync_guardian_period_days(uuid, date[], smallint) from public, anon;
