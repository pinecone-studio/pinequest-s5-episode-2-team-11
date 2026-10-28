-- Bloomy · Бүртгэл устгах хүсэлт (охин). Safe to re-run.
-- A daughter cannot delete her account herself: she sends a request that her
-- guardian must approve (App Store guideline 5.1.1(v)).
-- TODO: guardian approval UI + the actual deletion job. Nothing is deleted yet.

create table if not exists public.account_deletion_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  family_id   uuid references public.families (id) on delete set null,
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  created_at  timestamptz not null default now(),
  decided_at  timestamptz,
  decided_by  uuid references auth.users (id) on delete set null
);
create unique index if not exists account_deletion_requests_one_pending
  on public.account_deletion_requests (user_id) where status = 'pending';

alter table public.account_deletion_requests enable row level security;
revoke all on table public.account_deletion_requests from anon, authenticated;

-- Returns the pending request id (creates it once).
create or replace function public.request_my_account_deletion()
returns uuid language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null or not exists (select 1 from public.profiles where id = auth.uid() and role = 'daughter') then
    raise exception 'daughter_only';
  end if;
  select id into v_id from public.account_deletion_requests where user_id = auth.uid() and status = 'pending';
  if v_id is null then
    insert into public.account_deletion_requests (user_id, family_id)
    values (auth.uid(), (select family_id from public.profiles where id = auth.uid()))
    returning id into v_id;
  end if;
  return v_id;
end $$;

revoke all on function public.request_my_account_deletion() from public, anon;
grant execute on function public.request_my_account_deletion() to authenticated;

notify pgrst, 'reload schema';
