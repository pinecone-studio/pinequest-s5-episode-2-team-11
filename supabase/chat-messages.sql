-- ============================================================
-- Bloomy · «Блүми эгч» чатын түүх
-- schema.sql-ийн дараа ажиллуулна. Дахин ажиллуулсан ч асуудалгүй.
--
-- Нууцлал:
--   • Зөвхөн эзэн нь (охин өөрөө) уншина. Асран хамгаалагч ХАРАХГҮЙ.
-- ============================================================

create table if not exists public.chat_messages (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  role       text not null check (role in ('user', 'assistant')),
  content    text not null check (char_length(content) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_user_idx on public.chat_messages (user_id, id desc);

alter table public.chat_messages enable row level security;

drop policy if exists "chat_messages: read own" on public.chat_messages;
create policy "chat_messages: read own" on public.chat_messages
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "chat_messages: insert own" on public.chat_messages;
create policy "chat_messages: insert own" on public.chat_messages
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "chat_messages: delete own" on public.chat_messages;
create policy "chat_messages: delete own" on public.chat_messages
  for delete to authenticated using (user_id = auth.uid());

grant select, insert, delete on public.chat_messages to authenticated;
