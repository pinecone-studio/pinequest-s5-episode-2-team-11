-- Run after cycle-calendar-migration.sql.
-- The app may read daily metadata, but note text is returned only by the
-- authenticated Node route after PIN verification.

drop function if exists public.get_my_day_logs(date, date);
create function public.get_my_day_logs(p_from date, p_to date)
returns table(log_date date, mood smallint, pain smallint, symptoms text[], flow text, share_mood boolean, updated_at timestamptz)
language sql security definer set search_path = public
as $$
  select d.log_date, d.mood, d.pain, d.symptoms, d.flow, d.share_mood, d.updated_at
  from public.day_logs d
  where d.user_id = auth.uid() and d.log_date between p_from and p_to
  order by d.log_date;
$$;
grant execute on function public.get_my_day_logs(date, date) to authenticated;
revoke all on function public.get_my_day_logs(date, date) from public, anon;

-- Old check-ins only recorded cramps as a symptom; preserve it as a pain value.
update public.day_logs set pain = 2
where pain is null and symptoms @> array['cramps']::text[];
