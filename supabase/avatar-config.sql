-- Bloomy · Давхаргат аватарын тохиргоо. Run after avatar-mood.sql. Safe to re-run.
-- avatar_config (jsonb, lib/avatar.ts AvatarConfig) replaces avatar_look/avatar_skin
-- for drawing. The old columns are kept untouched: a client maps them to the
-- closest new items the first time (migrateLook) and then writes avatar_config.

alter table public.profiles add column if not exists avatar_config jsonb;

drop function if exists public.list_friends_with_avatars();
create function public.list_friends_with_avatars()
returns table (
  id uuid,
  display_name text,
  avatar_look jsonb,
  avatar_skin smallint,
  avatar_background text,
  avatar_mood smallint,
  avatar_mood_date date,
  avatar_config jsonb
)
language sql stable security definer set search_path = public as $$
  select p.id, p.display_name, p.avatar_look, p.avatar_skin, p.avatar_background, p.avatar_mood, p.avatar_mood_date, p.avatar_config
  from public.friendships f
  join public.profiles p on p.id = f.friend_id
  where f.user_id = auth.uid()
  order by p.display_name
$$;

revoke all on function public.list_friends_with_avatars() from public, anon;
grant execute on function public.list_friends_with_avatars() to authenticated;

notify pgrst, 'reload schema';
