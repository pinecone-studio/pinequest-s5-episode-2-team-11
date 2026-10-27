-- Run after cycle-calendar-migration.sql when updating an existing project.
-- Replaces only the sync RPC body; it does not add or change tables/columns.
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

  -- The selected dates are authoritative. Pending guardian proposals are not touched.
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

grant execute on function public.sync_my_period_starts(date[], smallint) to authenticated;
revoke all on function public.sync_my_period_starts(date[], smallint) from public, anon;
