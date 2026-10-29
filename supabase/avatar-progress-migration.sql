alter table public.profiles
  add column if not exists avatar_xp integer not null default 0 check (avatar_xp >= 0),
  add column if not exists avatar_xp_spent integer not null default 0 check (avatar_xp_spent >= 0),
  add column if not exists avatar_petals integer not null default 30 check (avatar_petals >= 0),
  add column if not exists avatar_walk jsonb not null default '{"date":"","steps":0,"xp":0}'::jsonb,
  add column if not exists avatar_gift_date date;

grant select (
  avatar_xp,
  avatar_xp_spent,
  avatar_petals,
  avatar_walk,
  avatar_gift_date
), update (
  avatar_xp,
  avatar_xp_spent,
  avatar_petals,
  avatar_walk,
  avatar_gift_date
) on public.profiles to authenticated;
