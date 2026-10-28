-- =====================================================================
--  Bloomy — Найзын дүр: өрөө (vibe) + өнөөдрийн сэтгэл санааны царай
--  friends.sql-ийн ДАРАА ажиллуулна (аль хэдийн ажилласан төсөлд үүнийг л ажиллуулахад хангалттай):
--  Supabase → SQL Editor → New query → энэ файлыг бүтнээр нь хуулж → Run
--  Дахин ажиллуулахад аюулгүй (өгөгдөл устахгүй).
-- =====================================================================

-- Апп 6 арьсны өнгө, "room" дэвсгэртэй — хуучин шалгалт дүр хадгалахыг хориглож байсан
alter table public.profiles drop constraint if exists profiles_avatar_skin_check;
alter table public.profiles add constraint profiles_avatar_skin_check check (avatar_skin between 0 and 5);
alter table public.profiles drop constraint if exists profiles_avatar_background_check;
alter table public.profiles add constraint profiles_avatar_background_check
  check (avatar_background in ('pink', 'lilac', 'mint', 'blue', 'peach', 'yellow', 'room'));
alter table public.profiles alter column avatar_background set default 'room';

-- Өнөөдрийн сэтгэл санаа (1–5) → найзууд дүрийн царайг харна
alter table public.profiles
  add column if not exists avatar_mood smallint check (avatar_mood between 1 and 5),
  add column if not exists avatar_mood_date date;

drop function if exists public.list_friends_with_avatars();
create function public.list_friends_with_avatars()
returns table (
  id uuid,
  display_name text,
  avatar_look jsonb,
  avatar_skin smallint,
  avatar_background text,
  avatar_mood smallint,
  avatar_mood_date date
)
language sql stable security definer set search_path = public as $$
  select p.id, p.display_name, p.avatar_look, p.avatar_skin, p.avatar_background, p.avatar_mood, p.avatar_mood_date
  from public.friendships f
  join public.profiles p on p.id = f.friend_id
  where f.user_id = auth.uid()
  order by p.display_name
$$;

revoke all on function public.list_friends_with_avatars() from public, anon;
grant execute on function public.list_friends_with_avatars() to authenticated;
