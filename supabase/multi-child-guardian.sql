-- Upgrade existing Bloomy projects to guardian-owned access codes and child-targeted messages.
-- Run once in Supabase SQL Editor after deploying the matching app code.

alter table public.notifications
  add column if not exists recipient_id uuid references auth.users (id) on delete set null;

alter table public.kit_checks
  add column if not exists child_id uuid references public.profiles (id) on delete cascade;

-- Preserve the existing household checklist by copying its checked items to each child.
do $$
declare v_pk text;
begin
  select conname into v_pk
  from pg_constraint
  where conrelid = 'public.kit_checks'::regclass and contype = 'p';
  if v_pk is not null then
    execute format('alter table public.kit_checks drop constraint %I', v_pk);
  end if;
end $$;

insert into public.kit_checks (family_id, child_id, item_id)
select old.family_id, child.id, old.item_id
from public.kit_checks old
join public.profiles child on child.family_id = old.family_id and child.role = 'daughter'
where old.child_id is null
on conflict do nothing;

delete from public.kit_checks where child_id is null;
alter table public.kit_checks alter column child_id set not null;
alter table public.kit_checks add primary key (family_id, child_id, item_id);

create index if not exists notifications_recipient_idx
  on public.notifications (recipient_id, created_at desc);

-- Existing households already linked to a guardian transfer code ownership to that guardian.
update public.families f
set created_by = guardian.id
from (
  select distinct on (family_id) family_id, id
  from public.profiles
  where role = 'mother' and family_id is not null
  order by family_id, created_at, id
) guardian
where guardian.family_id = f.id
  and f.created_by is distinct from guardian.id;

-- Keep legacy guardian-to-child notices visible when the family has only one child.
update public.notifications n
set recipient_id = only_child.id
from (
  select family_id, min(id::text)::uuid as id
  from public.profiles
  where role = 'daughter' and family_id is not null
  group by family_id
  having count(*) = 1
) only_child
where n.family_id = only_child.family_id
  and n.recipient_role = 'daughter'
  and n.recipient_id is null
  and exists (select 1 from public.profiles p where p.id = n.sender_id and p.role = 'mother');

drop policy if exists "profiles: read self and family" on public.profiles;
create policy "profiles: read self and family" on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or (
      family_id = public.my_family_id()
      and (public.my_role() = 'mother' or role = 'mother')
    )
  );

drop policy if exists "mood: read own or shared" on public.mood_logs;
create policy "mood: read own or shared" on public.mood_logs
  for select to authenticated
  using (
    user_id = auth.uid()
    or (
      family_id = public.my_family_id()
      and public.my_role() = 'mother'
      and exists (select 1 from public.profiles p where p.id = mood_logs.user_id and p.share_mood)
    )
  );

create or replace function public.create_family()
returns text language plpgsql security definer set search_path = public as $$
declare
  v_code text;
  v_family uuid;
  v_role text;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;

  select role into v_role from public.profiles where id = auth.uid();
  if v_role is distinct from 'mother' then raise exception 'guardian_only'; end if;

  select f.id, f.code into v_family, v_code
  from public.families f
  join public.profiles p on p.family_id = f.id
  where p.id = auth.uid();
  if v_code is not null then
    update public.families set created_by = auth.uid() where id = v_family;
    return v_code;
  end if;

  loop
    v_code := 'BLOOM-' || lpad((floor(random() * 900000) + 100000)::int::text, 6, '0');
    exit when not exists (select 1 from public.families where code = v_code);
  end loop;

  insert into public.families (code, created_by) values (v_code, auth.uid())
  returning id into v_family;

  update public.profiles set family_id = v_family where id = auth.uid();
  insert into public.supplies (family_id, kind, count, max) values
    (v_family, 'day', 3, 10),
    (v_family, 'night', 4, 8),
    (v_family, 'liner', 10, 20);

  return v_code;
end;
$$;

create or replace function public.join_family(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_family uuid;
  v_guardian uuid;
  v_name text;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if (select role from public.profiles where id = auth.uid()) is distinct from 'daughter' then
    raise exception 'daughter_only';
  end if;

  select id, created_by into v_family, v_guardian
  from public.families where code = upper(trim(p_code));
  if v_family is null or not exists (
    select 1 from public.profiles p
    where p.id = v_guardian and p.role = 'mother' and p.family_id = v_family
  ) then
    raise exception 'invalid_code';
  end if;

  update public.profiles set family_id = v_family where id = auth.uid()
  returning display_name into v_name;
  update public.mood_logs set family_id = v_family where user_id = auth.uid();

  insert into public.notifications (family_id, sender_id, recipient_id, recipient_role, kind, text)
  values (
    v_family, auth.uid(), v_guardian, 'mother', 'join',
    coalesce(nullif(v_name, ''), 'Охин тань') || ' гэр бүлийн хаалттай бүлэгт нэгдлээ 🌿'
  );

  return v_family;
end;
$$;

create or replace function public.leave_family()
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_family uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if (select role from public.profiles where id = auth.uid()) is distinct from 'daughter' then
    raise exception 'daughter_only';
  end if;

  select family_id into v_family from public.profiles where id = auth.uid();
  if v_family is null then return false; end if;

  update public.profiles set family_id = null where id = auth.uid();
  update public.mood_logs set family_id = null where user_id = auth.uid();
  if to_regclass('public.day_logs') is not null then
    execute 'update public.day_logs set family_id = null where user_id = $1' using auth.uid();
  end if;

  return true;
end;
$$;

drop policy if exists "notif: read mine" on public.notifications;
create policy "notif: read mine" on public.notifications
  for select to authenticated
  using (
    family_id = public.my_family_id()
    and recipient_role = public.my_role()
    and (recipient_id = auth.uid() or (recipient_id is null and public.my_role() = 'mother'))
  );

drop policy if exists "notif: send to family" on public.notifications;
create policy "notif: send to family" on public.notifications
  for insert to authenticated
  with check (
    family_id = public.my_family_id()
    and sender_id = auth.uid()
    and recipient_id is not null
    and exists (
      select 1 from public.profiles p
      where p.id = recipient_id
        and p.family_id = public.my_family_id()
        and p.role = recipient_role
    )
  );

drop policy if exists "notif: mark read" on public.notifications;
create policy "notif: mark read" on public.notifications
  for update to authenticated
  using (
    family_id = public.my_family_id()
    and recipient_role = public.my_role()
    and (recipient_id = auth.uid() or (recipient_id is null and public.my_role() = 'mother'))
  )
  with check (
    family_id = public.my_family_id()
    and recipient_role = public.my_role()
    and (recipient_id = auth.uid() or (recipient_id is null and public.my_role() = 'mother'))
  );

drop policy if exists "kit: family all" on public.kit_checks;
create policy "kit: family all" on public.kit_checks
  for all to authenticated
  using (
    family_id = public.my_family_id()
    and (public.my_role() = 'mother' or child_id = auth.uid())
    and exists (select 1 from public.profiles p where p.id = child_id and p.family_id = public.my_family_id() and p.role = 'daughter')
  )
  with check (
    family_id = public.my_family_id()
    and (public.my_role() = 'mother' or child_id = auth.uid())
    and exists (select 1 from public.profiles p where p.id = child_id and p.family_id = public.my_family_id() and p.role = 'daughter')
  );

grant execute on function public.create_family() to authenticated;
grant execute on function public.join_family(text) to authenticated;
grant execute on function public.leave_family() to authenticated;
