-- =====================================================================
--  Bloomy — Найзууд · Хэрэглэлийн SOS
--  schema.sql-ийн ДАРАА ажиллуулна:
--  Supabase → SQL Editor → New query → энэ файлыг бүтнээр нь хуулж → Run
--  Дахин ажиллуулахад аюулгүй (өгөгдөл устахгүй).
--
--  Нууцлал:
--   • Зөвхөн охид (daughter) ашиглана. Ээж нар найзуудын SOS-ийг харахгүй.
--   • Найзууд өөрийн хувцас, дэвсгэр, арьсны өнгийг л хуваалцана.
--   • Мөчлөг, сэтгэл санаа болон XP/дэлбээ зэрэг тоглоомын оноог хуваалцахгүй.
--   • Чат байхгүй: хариулт нь тогтсон 4 сонголтоос (дээрэлхэлтээс сэргийлнэ).
-- =====================================================================

-- ---------- Найзуудтай хуваалцах avatar ----------

alter table public.profiles
  add column if not exists avatar_look jsonb not null
    default '{"hair":"hair-long-brown","top":"top-tee-white","bottom":"bottom-jeans","shoes":"shoes-white","acc":"acc-none"}'::jsonb,
  add column if not exists avatar_skin smallint not null default 0
    check (avatar_skin between 0 and 3),
  add column if not exists avatar_background text not null default 'pink'
    check (avatar_background in ('pink', 'lilac', 'mint', 'blue', 'peach', 'yellow'));

-- ---------- Найзын код (жишээ: K7M2QX) ----------

alter table public.profiles add column if not exists friend_code text;
create unique index if not exists profiles_friend_code_idx on public.profiles (friend_code);

create or replace function public.gen_friend_code()
returns text language plpgsql volatile set search_path = public as $$
declare
  chars constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';  -- 0/O, 1/I/L гэх мэт андуурагдах тэмдэгтгүй
  c text;
begin
  loop
    c := '';
    for i in 1..6 loop
      c := c || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    end loop;
    exit when not exists (select 1 from public.profiles where friend_code = c);
  end loop;
  return c;
end;
$$;

create or replace function public.set_friend_code()
returns trigger language plpgsql as $$
begin
  if new.friend_code is null then new.friend_code := public.gen_friend_code(); end if;
  -- Хэрэглэгч өөрийн кодыг гараар өөрчилж болохгүй
  if tg_op = 'UPDATE' and current_user = 'authenticated' and new.friend_code is distinct from old.friend_code then
    raise exception 'friend_code_locked';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_friend_code on public.profiles;
create trigger profiles_friend_code before insert or update on public.profiles
  for each row execute function public.set_friend_code();

update public.profiles set friend_code = public.gen_friend_code() where friend_code is null;

-- ---------- Хүснэгтүүд ----------

create table if not exists public.friendships (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  friend_id  uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);

create table if not exists public.friend_groups (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles (id) on delete cascade,
  name       text not null check (char_length(trim(name)) between 1 and 24),
  emoji      text not null default '💗' check (char_length(emoji) <= 8),
  created_at timestamptz not null default now()
);

create table if not exists public.friend_group_members (
  group_id  uuid not null references public.friend_groups (id) on delete cascade,
  member_id uuid not null references public.profiles (id) on delete cascade,
  primary key (group_id, member_id)
);

create table if not exists public.pad_requests (
  id          bigint generated always as identity primary key,
  sender_id   uuid not null references public.profiles (id) on delete cascade,
  sender_name text not null default '',
  group_id    uuid references public.friend_groups (id) on delete set null,
  group_name  text not null default '',
  place       text not null check (char_length(place) <= 40),
  resolved    boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.pad_request_recipients (
  request_id bigint not null references public.pad_requests (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  primary key (request_id, user_id)
);

create table if not exists public.pad_responses (
  id             bigint generated always as identity primary key,
  request_id     bigint not null references public.pad_requests (id) on delete cascade,
  responder_id   uuid not null references public.profiles (id) on delete cascade,
  responder_name text not null default '',
  reply          text not null check (reply in ('coming', 'in_bag', 'bring', 'no')),
  created_at     timestamptz not null default now(),
  unique (request_id, responder_id)
);

create index if not exists friend_groups_owner_idx     on public.friend_groups (owner_id);
create index if not exists pad_requests_sender_idx     on public.pad_requests (sender_id, created_at desc);
create index if not exists pad_recipients_user_idx     on public.pad_request_recipients (user_id);
create index if not exists pad_responses_request_idx   on public.pad_responses (request_id);

-- ---------- Туслах функцууд ----------

create or replace function public.is_friend(p_other uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.friendships where user_id = auth.uid() and friend_id = p_other)
$$;

create or replace function public.owns_group(p_group uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.friend_groups where id = p_group and owner_id = auth.uid())
$$;

create or replace function public.is_pad_recipient(p_request bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.pad_request_recipients where request_id = p_request and user_id = auth.uid())
$$;

create or replace function public.is_pad_sender(p_request bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.pad_requests where id = p_request and sender_id = auth.uid())
$$;

-- ---------- Найз нэмэх / хасах / жагсаалт ----------

create or replace function public.add_friend(p_code text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_me     uuid := auth.uid();
  v_friend public.profiles%rowtype;
begin
  if v_me is null then raise exception 'not_authenticated'; end if;
  if public.my_role() <> 'daughter' then raise exception 'teens_only'; end if;

  select * into v_friend from public.profiles where friend_code = upper(trim(p_code));
  if v_friend.id is null then raise exception 'invalid_code'; end if;
  if v_friend.id = v_me then raise exception 'own_code'; end if;
  if v_friend.role <> 'daughter' then raise exception 'teens_only'; end if;

  insert into public.friendships (user_id, friend_id) values (v_me, v_friend.id), (v_friend.id, v_me)
  on conflict do nothing;

  return json_build_object('id', v_friend.id, 'display_name', v_friend.display_name);
end;
$$;

create or replace function public.remove_friend(p_friend uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  delete from public.friendships
  where (user_id = auth.uid() and friend_id = p_friend) or (user_id = p_friend and friend_id = auth.uid());
  -- Бие биеийнхээ бүлгээс ч хасна
  delete from public.friend_group_members m using public.friend_groups g
  where m.group_id = g.id
    and ((g.owner_id = auth.uid() and m.member_id = p_friend) or (g.owner_id = p_friend and m.member_id = auth.uid()));
end;
$$;

create or replace function public.list_friends()
returns table (id uuid, display_name text) language sql stable security definer set search_path = public as $$
  select p.id, p.display_name
  from public.friendships f join public.profiles p on p.id = f.friend_id
  where f.user_id = auth.uid()
  order by p.display_name
$$;

drop function if exists public.list_friends_with_avatars();
create function public.list_friends_with_avatars()
returns table (
  id uuid,
  display_name text,
  avatar_look jsonb,
  avatar_skin smallint,
  avatar_background text
)
language sql stable security definer set search_path = public as $$
  select p.id, p.display_name, p.avatar_look, p.avatar_skin, p.avatar_background
  from public.friendships f
  join public.profiles p on p.id = f.friend_id
  where f.user_id = auth.uid()
  order by p.display_name
$$;

-- ---------- Хэрэглэлийн SOS ----------

create or replace function public.send_pad_request(p_group uuid, p_place text)
returns bigint language plpgsql security definer set search_path = public as $$
declare
  v_me    uuid := auth.uid();
  v_group public.friend_groups%rowtype;
  v_id    bigint;
  v_count int;
begin
  if v_me is null then raise exception 'not_authenticated'; end if;
  if public.my_role() <> 'daughter' then raise exception 'teens_only'; end if;

  select * into v_group from public.friend_groups where id = p_group and owner_id = v_me;
  if v_group.id is null then raise exception 'invalid_group'; end if;

  -- 20 секундэд нэгээс олон удаа илгээхгүй (санамсаргүй давхар дарахаас)
  if exists (
    select 1 from public.pad_requests
    where sender_id = v_me and created_at > now() - interval '20 seconds'
  ) then
    raise exception 'too_soon';
  end if;

  insert into public.pad_requests (sender_id, sender_name, group_id, group_name, place)
  values (v_me, coalesce((select display_name from public.profiles where id = v_me), ''), v_group.id, v_group.name, p_place)
  returning id into v_id;

  insert into public.pad_request_recipients (request_id, user_id)
  select v_id, m.member_id
  from public.friend_group_members m
  join public.friendships f on f.user_id = v_me and f.friend_id = m.member_id
  where m.group_id = v_group.id;

  get diagnostics v_count = row_count;
  if v_count = 0 then raise exception 'empty_group'; end if;

  -- Өмнөх нээлттэй хүсэлтүүдийг хаана
  update public.pad_requests set resolved = true where sender_id = v_me and id <> v_id and not resolved;
  return v_id;
end;
$$;

create or replace function public.send_pad_request_to_friends(p_recipient_ids uuid[], p_place text)
returns bigint language plpgsql security definer set search_path = public as $$
declare
  v_me    uuid := auth.uid();
  v_id    bigint;
  v_count int;
  v_names text;
begin
  if v_me is null then raise exception 'not_authenticated'; end if;
  if public.my_role() <> 'daughter' then raise exception 'teens_only'; end if;
  if p_recipient_ids is null or cardinality(p_recipient_ids) = 0 then
    raise exception 'empty_recipients';
  end if;
  if p_place is null or char_length(p_place) > 40 then raise exception 'invalid_place'; end if;

  if exists (
    select 1
    from (select distinct unnest(p_recipient_ids) as id) selected
    where not exists (
      select 1 from public.friendships f
      where f.user_id = v_me and f.friend_id = selected.id
    )
  ) then
    raise exception 'not_friends';
  end if;

  if exists (
    select 1 from public.pad_requests
    where sender_id = v_me and created_at > now() - interval '20 seconds'
  ) then
    raise exception 'too_soon';
  end if;

  select string_agg(p.display_name, ', ' order by p.display_name)
  into v_names
  from (select distinct unnest(p_recipient_ids) as id) selected
  join public.profiles p on p.id = selected.id;

  insert into public.pad_requests (sender_id, sender_name, group_id, group_name, place)
  values (
    v_me,
    coalesce((select display_name from public.profiles where id = v_me), ''),
    null,
    coalesce(v_names, ''),
    p_place
  )
  returning id into v_id;

  insert into public.pad_request_recipients (request_id, user_id)
  select v_id, selected.id
  from (select distinct unnest(p_recipient_ids) as id) selected;
  get diagnostics v_count = row_count;
  if v_count = 0 then raise exception 'empty_recipients'; end if;

  update public.pad_requests set resolved = true
  where sender_id = v_me and id <> v_id and not resolved;
  return v_id;
end;
$$;

create or replace function public.respond_pad_request(p_request bigint, p_reply text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_pad_recipient(p_request) then raise exception 'not_recipient'; end if;
  insert into public.pad_responses (request_id, responder_id, responder_name, reply)
  values (p_request, auth.uid(), coalesce((select display_name from public.profiles where id = auth.uid()), ''), p_reply)
  on conflict (request_id, responder_id) do update set reply = excluded.reply, created_at = now();
end;
$$;

grant execute on function public.add_friend(text) to authenticated;
grant execute on function public.remove_friend(uuid) to authenticated;
grant execute on function public.list_friends() to authenticated;
revoke all on function public.list_friends_with_avatars() from public, anon;
grant execute on function public.list_friends_with_avatars() to authenticated;
grant execute on function public.send_pad_request(uuid, text) to authenticated;
revoke all on function public.send_pad_request_to_friends(uuid[], text) from public, anon;
grant execute on function public.send_pad_request_to_friends(uuid[], text) to authenticated;
grant execute on function public.respond_pad_request(bigint, text) to authenticated;

-- ---------- Row Level Security ----------

alter table public.friendships            enable row level security;
alter table public.friend_groups          enable row level security;
alter table public.friend_group_members   enable row level security;
alter table public.pad_requests           enable row level security;
alter table public.pad_request_recipients enable row level security;
alter table public.pad_responses          enable row level security;

-- friendships: зөвхөн өөрийнхөө (нэмэх/хасах нь RPC-ээр)
drop policy if exists "friendships: read own" on public.friendships;
create policy "friendships: read own" on public.friendships
  for select to authenticated using (user_id = auth.uid());

-- friend_groups: зөвхөн эзэн нь
drop policy if exists "groups: owner all" on public.friend_groups;
create policy "groups: owner all" on public.friend_groups
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and public.my_role() = 'daughter');

-- friend_group_members: бүлгийн эзэн, зөвхөн өөрийн найзуудыг нэмнэ
drop policy if exists "members: owner read" on public.friend_group_members;
create policy "members: owner read" on public.friend_group_members
  for select to authenticated using (public.owns_group(group_id));

drop policy if exists "members: owner add friends" on public.friend_group_members;
create policy "members: owner add friends" on public.friend_group_members
  for insert to authenticated
  with check (public.owns_group(group_id) and public.is_friend(member_id));

drop policy if exists "members: owner remove" on public.friend_group_members;
create policy "members: owner remove" on public.friend_group_members
  for delete to authenticated using (public.owns_group(group_id));

-- pad_requests: илгээгч эсвэл хүлээн авагч уншина; илгээгч л «шийдэгдсэн» гэж тэмдэглэнэ
drop policy if exists "pad: sender or recipient read" on public.pad_requests;
create policy "pad: sender or recipient read" on public.pad_requests
  for select to authenticated using (sender_id = auth.uid() or public.is_pad_recipient(id));

drop policy if exists "pad: sender resolve" on public.pad_requests;
create policy "pad: sender resolve" on public.pad_requests
  for update to authenticated using (sender_id = auth.uid()) with check (sender_id = auth.uid());

drop policy if exists "pad recipients: read" on public.pad_request_recipients;
create policy "pad recipients: read" on public.pad_request_recipients
  for select to authenticated using (user_id = auth.uid() or public.is_pad_sender(request_id));

drop policy if exists "pad responses: read" on public.pad_responses;
create policy "pad responses: read" on public.pad_responses
  for select to authenticated using (responder_id = auth.uid() or public.is_pad_sender(request_id));

-- ---------- Realtime ----------

do $$
declare t text;
begin
  foreach t in array array['friendships', 'pad_requests', 'pad_request_recipients', 'pad_responses'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
