-- =====================================================================
--  Bloomy — Supabase схем
--  Supabase → SQL Editor → New query → энэ файлыг бүтнээр нь хуулж → Run
-- =====================================================================

-- ---------- Хүснэгтүүд ----------

create table if not exists public.families (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,              -- жишээ: BLOOM-482913
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  role              text not null check (role in ('mother', 'daughter')),
  display_name      text not null default '',
  family_id         uuid references public.families (id) on delete set null,
  cycle_length      int  not null default 28 check (cycle_length between 15 and 60),
  period_length     int  not null default 5  check (period_length between 1 and 14),
  last_period_start date,
  share_mood        boolean not null default true,
  no_period_yet     boolean not null default false,  -- анхны сарын тэмдэг хараахан ирээгүй
  birth_date        date,                            -- ордын зурхайд ашиглана
  created_at        timestamptz not null default now()
);

create table if not exists public.supplies (
  family_id  uuid not null references public.families (id) on delete cascade,
  kind       text not null,                       -- day | night | liner
  label      text,
  emoji      text,
  count      int  not null default 0 check (count >= 0),
  max        int  not null default 10 check (max > 0),
  updated_at timestamptz not null default now(),
  primary key (family_id, kind)
);

alter table public.supplies add column if not exists label text;
alter table public.supplies add column if not exists emoji text;

create table if not exists public.mood_logs (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  family_id  uuid references public.families (id) on delete cascade,
  log_date   date not null default current_date,
  mood       text not null,                        -- sad | angry | tired | craving
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create table if not exists public.notifications (
  id             bigint generated always as identity primary key,
  family_id      uuid not null references public.families (id) on delete cascade,
  sender_id      uuid references auth.users (id) on delete set null,
  recipient_id   uuid references auth.users (id) on delete set null,
  recipient_role text not null check (recipient_role in ('mother', 'daughter')),
  kind           text not null default 'info',     -- info | sos | supply | period | join | care
  text           text not null check (char_length(text) <= 500),
  read           boolean not null default false,
  created_at     timestamptz not null default now()
);

create table if not exists public.kit_checks (
  family_id uuid not null references public.families (id) on delete cascade,
  child_id  uuid not null references public.profiles (id) on delete cascade,
  item_id   text not null,
  primary key (family_id, child_id, item_id)
);

alter table public.profiles add column if not exists no_period_yet boolean not null default false;
alter table public.profiles add column if not exists birth_date date;
alter table public.notifications add column if not exists recipient_id uuid references auth.users (id) on delete set null;
alter table public.kit_checks add column if not exists child_id uuid references public.profiles (id) on delete cascade;

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

-- Upgrade old family-wide checklists by copying them to each child in the family.
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

create index if not exists profiles_family_idx      on public.profiles (family_id);
create index if not exists notifications_family_idx on public.notifications (family_id, recipient_role, created_at desc);
create index if not exists notifications_recipient_idx on public.notifications (recipient_id, created_at desc);
create index if not exists mood_logs_family_idx     on public.mood_logs (family_id, log_date desc);

-- ---------- Туслах функцууд (RLS-д ашиглана) ----------

create or replace function public.my_family_id()
returns uuid language sql stable security definer set search_path = public as $$
  select family_id from public.profiles where id = auth.uid()
$$;

create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

-- ---------- Бүртгүүлэхэд профайл автоматаар үүсгэх ----------

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, display_name, birth_date)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'daughter'),
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    nullif(new.raw_user_meta_data ->> 'birth_date', '')::date
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Асран хамгаалагч өөрийн access code-той гэр бүл үүсгэх ----------

create or replace function public.create_family()
returns text language plpgsql security definer set search_path = public as $$
declare
  v_code   text;
  v_family uuid;
  v_role   text;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;

  select role into v_role from public.profiles where id = auth.uid();
  if v_role is distinct from 'mother' then raise exception 'guardian_only'; end if;

  -- Асран хамгаалагч кодын эзэн байна; өмнөх хувилбарын гэр бүлийг ч эзэмшинэ.
  select f.code into v_code
  from public.families f join public.profiles p on p.family_id = f.id
  where p.id = auth.uid();
  if v_code is not null then
    update public.families set created_by = auth.uid() where code = v_code;
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

-- ---------- Хүүхэд асран хамгаалагчийн кодоор гэр бүлд нэгдэх ----------

create or replace function public.join_family(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_family uuid;
  v_name   text;
  v_guardian uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;

  if (select role from public.profiles where id = auth.uid()) is distinct from 'daughter' then
    raise exception 'daughter_only';
  end if;

  select id, created_by into v_family, v_guardian from public.families
  where code = upper(trim(p_code));
  if v_family is null then raise exception 'invalid_code'; end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = v_guardian and p.role = 'mother' and p.family_id = v_family
  ) then raise exception 'invalid_code'; end if;

  update public.profiles set family_id = v_family where id = auth.uid()
  returning display_name into v_name;

  update public.mood_logs set family_id = v_family where user_id = auth.uid();

  insert into public.notifications (family_id, sender_id, recipient_id, recipient_role, kind, text)
  values (v_family, auth.uid(), v_guardian, 'mother', 'join',
          coalesce(nullif(v_name, ''), 'Охин тань') || ' гэр бүлийн хаалттай бүлэгт нэгдлээ 🌿');

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

grant execute on function public.create_family() to authenticated;
grant execute on function public.join_family(text) to authenticated;
grant execute on function public.leave_family() to authenticated;

-- ---------- Row Level Security: зөвхөн өөрийн гэр бүлийн мэдээллийг харна ----------

alter table public.families      enable row level security;
alter table public.profiles      enable row level security;
alter table public.supplies      enable row level security;
alter table public.mood_logs     enable row level security;
alter table public.notifications enable row level security;
alter table public.kit_checks    enable row level security;

-- families
drop policy if exists "family: members read" on public.families;
create policy "family: members read" on public.families
  for select to authenticated using (id = public.my_family_id());

-- profiles
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

-- Профайл дутуу бол (schema-аас өмнө бүртгүүлсэн) апп өөрөө нөхөж үүсгэнэ
drop policy if exists "profiles: insert self" on public.profiles;
create policy "profiles: insert self" on public.profiles
  for insert to authenticated
  with check (id = auth.uid() and family_id is null);

drop policy if exists "profiles: update self" on public.profiles;
create policy "profiles: update self" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Профайлын role, family_id-г хэрэглэгч өөрөө өөрчилж чадахгүй (зөвхөн RPC-ээр)
-- (RPC функцүүд security definer тул current_user нь 'postgres' байна → зөвшөөрөгдөнө)
create or replace function public.protect_profile_fields()
returns trigger language plpgsql as $$
begin
  if current_user = 'authenticated' then
    if new.role is distinct from old.role then raise exception 'role_locked'; end if;
    if new.family_id is distinct from old.family_id then raise exception 'family_locked'; end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile on public.profiles;
create trigger protect_profile before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- supplies
drop policy if exists "supplies: family read" on public.supplies;
create policy "supplies: family read" on public.supplies
  for select to authenticated using (family_id = public.my_family_id());

drop policy if exists "supplies: family update" on public.supplies;
create policy "supplies: family update" on public.supplies
  for update to authenticated
  using (family_id = public.my_family_id())
  with check (family_id = public.my_family_id());

drop policy if exists "supplies: family insert" on public.supplies;
create policy "supplies: family insert" on public.supplies
  for insert to authenticated
  with check (family_id = public.my_family_id());

drop policy if exists "supplies: family delete" on public.supplies;
create policy "supplies: family delete" on public.supplies
  for delete to authenticated using (family_id = public.my_family_id());

-- mood_logs: өөрийнхөө бүгдийг; гэр бүлийн гишүүнийх — тэр хуваалцахыг зөвшөөрсөн бол
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

drop policy if exists "mood: write own" on public.mood_logs;
create policy "mood: write own" on public.mood_logs
  for insert to authenticated
  with check (user_id = auth.uid() and family_id is not distinct from public.my_family_id());

drop policy if exists "mood: update own" on public.mood_logs;
create policy "mood: update own" on public.mood_logs
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "mood: delete own" on public.mood_logs;
create policy "mood: delete own" on public.mood_logs
  for delete to authenticated using (user_id = auth.uid());

-- notifications: зөвхөн өөрийн үүрэгт ирсэнийг уншина
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
      where p.id = recipient_id and p.family_id = public.my_family_id() and p.role = recipient_role
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

-- kit_checks
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

-- ---------- Realtime: хоёр утасны хооронд шууд синк ----------

do $$
declare t text;
begin
  foreach t in array array['profiles', 'supplies', 'mood_logs', 'notifications', 'kit_checks'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ---------- Schema-аас өмнө бүртгүүлсэн хэрэглэгчдэд профайл нөхөх ----------
insert into public.profiles (id, role, display_name)
select id,
       case when raw_user_meta_data ->> 'role' = 'mother' then 'mother' else 'daughter' end,
       coalesce(raw_user_meta_data ->> 'display_name', '')
from auth.users
on conflict (id) do nothing;
