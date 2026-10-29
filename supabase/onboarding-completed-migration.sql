-- Existing profiles are treated as having already used Bloomy, so this
-- tutorial is only shown automatically to profiles created after this change.
alter table public.profiles
  add column if not exists onboarding_completed boolean;

update public.profiles
set onboarding_completed = true
where onboarding_completed is null;

alter table public.profiles
  alter column onboarding_completed set default false,
  alter column onboarding_completed set not null;

-- profiles uses column-level grants, so new columns need explicit permissions.
grant select (onboarding_completed), update (onboarding_completed)
  on public.profiles to authenticated;
