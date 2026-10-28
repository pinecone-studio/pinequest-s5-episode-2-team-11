-- Bloomy · Төвлөрсөн мэдэгдэл (inbox + Web Push). Safe to re-run.
-- Run after schema.sql, multi-daughter-notification-targeting.sql and friends.sql.
--
-- The existing public.notifications table is extended (not replaced) so the
-- Messages tab keeps working: `text` stays the in-app detail, `title`/`body`
-- are the lock-screen text (never sensitive words), `read` mirrors status.
-- Only the server (service role, lib/notify.ts) inserts. Legacy inserts that
-- still happen inside SQL functions (join_family, propose_period_start,
-- respond_period_entry) are tagged by a trigger and picked up by the cron.

-- ---------- notifications ----------
alter table public.notifications alter column family_id drop not null; -- friends are in other families
alter table public.notifications add column if not exists event      text;
alter table public.notifications add column if not exists priority   text;
alter table public.notifications add column if not exists title      text;
alter table public.notifications add column if not exists body       text;
alter table public.notifications add column if not exists url        text;
alter table public.notifications add column if not exists group_key  text;
alter table public.notifications add column if not exists status     text not null default 'pending';
alter table public.notifications add column if not exists send_after timestamptz default now();
alter table public.notifications add column if not exists pushed_at  timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'notifications_priority_check') then
    alter table public.notifications add constraint notifications_priority_check check (priority is null or priority in ('urgent', 'normal', 'quiet'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'notifications_status_check') then
    alter table public.notifications add constraint notifications_status_check check (status in ('pending', 'sent', 'deferred', 'read'));
  end if;
end $$;

-- Rows from before this migration: already delivered in-app.
update public.notifications set status = case when read then 'read' else 'sent' end
where event is null and status = 'pending' and created_at < now() - interval '1 minute';

create index if not exists notifications_due_idx on public.notifications (status, send_after) where status in ('pending', 'deferred');
create index if not exists notifications_recipient_event_idx on public.notifications (recipient_id, event, created_at desc);

-- read ↔ status stay in sync whichever one the app updates.
create or replace function public.notifications_sync_read()
returns trigger language plpgsql set search_path = public
as $$
begin
  if new.status = 'read' then new.read := true;
  elsif new.read and not coalesce(old.read, false) then new.status := 'read';
  end if;
  return new;
end $$;
drop trigger if exists notifications_sync_read on public.notifications;
create trigger notifications_sync_read before update on public.notifications
  for each row execute function public.notifications_sync_read();

-- Legacy SQL inserts (no event) → tag them so the cron sends a neutral push.
create or replace function public.notifications_tag_legacy()
returns trigger language plpgsql set search_path = public
as $$
declare v_name text;
begin
  if new.event is not null then return new; end if;
  select coalesce(nullif(display_name, ''), 'Охин') into v_name from public.profiles where id = new.sender_id;
  if new.kind = 'join' and new.recipient_role = 'mother' then
    new.event := 'link_request'; new.priority := 'normal';
    new.body := 'Шинэ холболтын хүсэлт ирлээ';
  elsif new.kind = 'period' and new.recipient_role = 'daughter' then
    new.event := 'guardian_logged_period'; new.priority := 'quiet';
    new.body := 'Шалгах зүйл байна 📅'; new.url := '/daughter';
  elsif new.kind = 'period' and new.recipient_role = 'mother' then
    new.event := 'period_confirmed'; new.priority := 'normal';
    new.body := v_name || '-д онцгой мэдээ байна 🌸'; new.url := '/mother/calendar';
  else
    return new; -- unknown legacy kind: in-app only
  end if;
  new.title := 'Bloomy';
  new.group_key := new.event || '_' || coalesce(new.sender_id::text, '');
  new.status := 'pending';
  new.send_after := now();
  return new;
end $$;
drop trigger if exists notifications_tag_legacy on public.notifications;
create trigger notifications_tag_legacy before insert on public.notifications
  for each row execute function public.notifications_tag_legacy();

-- RLS: recipients read and mark read their own rows; nobody inserts from the client.
drop policy if exists "notif: send to family" on public.notifications;
drop policy if exists "notif: read own" on public.notifications;
create policy "notif: read own" on public.notifications
  for select to authenticated using (recipient_id = auth.uid());
drop policy if exists "notif: mark own read" on public.notifications;
create policy "notif: mark own read" on public.notifications
  for update to authenticated using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
revoke insert, delete on table public.notifications from authenticated;

-- ---------- notification_prefs ----------
create table if not exists public.notification_prefs (
  user_id           uuid primary key references auth.users (id) on delete cascade,
  friends_enabled   boolean not null default true,
  guardian_enabled  boolean not null default true,
  reminders_enabled boolean not null default true,
  diary_reminder    boolean not null default false,
  updated_at        timestamptz not null default now()
);
alter table public.notification_prefs enable row level security;
revoke all on table public.notification_prefs from anon;
grant select, insert, update on table public.notification_prefs to authenticated;
drop policy if exists "prefs: own" on public.notification_prefs;
create policy "prefs: own" on public.notification_prefs
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- push_subscriptions (one per device/browser) ----------
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;
revoke all on table public.push_subscriptions from anon;
grant select, insert, update, delete on table public.push_subscriptions to authenticated;
drop policy if exists "push: own" on public.push_subscriptions;
create policy "push: own" on public.push_subscriptions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Realtime for the bell (recipient_id filter).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

notify pgrst, 'reload schema';
