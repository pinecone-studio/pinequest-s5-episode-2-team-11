-- Guardian-only gender and private progress for the male guardian guide.
alter table public.profiles
  add column if not exists guardian_gender text not null default 'unspecified';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_guardian_gender_check'
  ) then
    alter table public.profiles
      add constraint profiles_guardian_gender_check
      check (guardian_gender in ('female', 'male', 'unspecified'));
  end if;
end $$;

update public.profiles p
set guardian_gender = case
  when u.raw_user_meta_data ->> 'guardian_gender' in ('female', 'male', 'unspecified')
    then u.raw_user_meta_data ->> 'guardian_gender'
  when u.raw_user_meta_data ->> 'guardian_type' = 'dad' then 'male'
  when u.raw_user_meta_data ->> 'guardian_type' = 'mom' then 'female'
  else 'unspecified'
end
from auth.users u
where p.id = u.id
  and p.role = 'mother';

update public.profiles
set guardian_gender = 'unspecified'
where role = 'daughter';

create table if not exists public.guardian_guide_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  card_id text not null check (card_id in (
    'period-basics',
    'when-she-tells-you',
    'supplies-at-home',
    'talk-without-shame',
    'when-to-see-doctor'
  )),
  completed_at timestamptz not null default now(),
  primary key (user_id, card_id)
);

alter table public.guardian_guide_progress enable row level security;

drop policy if exists "guardian guide progress: read own" on public.guardian_guide_progress;
create policy "guardian guide progress: read own" on public.guardian_guide_progress
  for select to authenticated
  using (user_id = auth.uid() and public.my_role() = 'mother');

drop policy if exists "guardian guide progress: insert own" on public.guardian_guide_progress;
create policy "guardian guide progress: insert own" on public.guardian_guide_progress
  for insert to authenticated
  with check (user_id = auth.uid() and public.my_role() = 'mother');

drop policy if exists "guardian guide progress: update own" on public.guardian_guide_progress;
create policy "guardian guide progress: update own" on public.guardian_guide_progress
  for update to authenticated
  using (user_id = auth.uid() and public.my_role() = 'mother')
  with check (user_id = auth.uid() and public.my_role() = 'mother');

drop policy if exists "guardian guide progress: delete own" on public.guardian_guide_progress;
create policy "guardian guide progress: delete own" on public.guardian_guide_progress
  for delete to authenticated
  using (user_id = auth.uid() and public.my_role() = 'mother');

grant select, insert, update, delete on public.guardian_guide_progress to authenticated;

create or replace function public.get_my_guardian_gender()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select guardian_gender
  from public.profiles
  where id = auth.uid() and role = 'mother'
$$;

create or replace function public.set_my_guardian_gender(p_gender text)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_gender is null or p_gender not in ('female', 'male', 'unspecified') then raise exception 'invalid_guardian_gender'; end if;

  update public.profiles
  set guardian_gender = p_gender
  where id = auth.uid() and role = 'mother';

  if not found then raise exception 'guardian_only'; end if;
  return p_gender;
end;
$$;

revoke all on function public.get_my_guardian_gender() from public, anon;
revoke all on function public.set_my_guardian_gender(text) from public, anon;
grant execute on function public.get_my_guardian_gender() to authenticated;
grant execute on function public.set_my_guardian_gender(text) to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, display_name, birth_date, guardian_gender)
  values (
    new.id,
    case when new.raw_user_meta_data ->> 'role' = 'mother' then 'mother' else 'daughter' end,
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    nullif(new.raw_user_meta_data ->> 'birth_date', '')::date,
    case
      when new.raw_user_meta_data ->> 'role' = 'mother'
        and new.raw_user_meta_data ->> 'guardian_gender' in ('female', 'male', 'unspecified')
        then new.raw_user_meta_data ->> 'guardian_gender'
      else 'unspecified'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.protect_profile_fields()
returns trigger language plpgsql as $$
begin
  if current_user = 'authenticated' then
    if new.role is distinct from old.role then raise exception 'role_locked'; end if;
    if new.family_id is distinct from old.family_id then raise exception 'family_locked'; end if;
    if new.guardian_gender is distinct from old.guardian_gender then raise exception 'guardian_gender_rpc_only'; end if;
  end if;
  if new.role = 'daughter' and new.guardian_gender <> 'unspecified' then
    raise exception 'daughter_guardian_gender_must_be_unspecified';
  end if;
  return new;
end;
$$;

-- PostgreSQL column privileges prevent family members from selecting this private field.
revoke select on public.profiles from anon, authenticated;
do $$
declare
  safe_columns text;
begin
  select string_agg(format('%I', column_name), ', ' order by ordinal_position)
  into safe_columns
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'profiles'
    and column_name <> 'guardian_gender';
  execute format('grant select (%s) on public.profiles to authenticated', safe_columns);
end $$;
