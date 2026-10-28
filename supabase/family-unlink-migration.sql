-- Restore the daughter self-unlink RPC for existing Supabase projects.
-- Safe to re-run in the Supabase SQL Editor.

create or replace function public.leave_family()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if (select role from public.profiles where id = auth.uid()) is distinct from 'daughter' then
    raise exception 'daughter_only';
  end if;

  select family_id into v_family
  from public.profiles
  where id = auth.uid()
  for update;

  if v_family is null then return false; end if;

  update public.profiles set family_id = null where id = auth.uid();
  update public.mood_logs set family_id = null where user_id = auth.uid();
  if to_regclass('public.day_logs') is not null then
    execute 'update public.day_logs set family_id = null where user_id = $1' using auth.uid();
  end if;

  return true;
end;
$$;

revoke all on function public.leave_family() from public, anon;
grant execute on function public.leave_family() to authenticated;

notify pgrst, 'reload schema';
