-- =====================================================================
--  Bloomy — Санал хүсэлт (Профайл → «Санал хүсэлт илгээх»)
--  schema.sql-ийн ДАРАА ажиллуулна:
--  Supabase → SQL Editor → New query → энэ файлыг бүтнээр нь хуулж → Run
--  Дахин ажиллуулахад аюулгүй (өгөгдөл устахгүй).
--
--  Нууцлал:
--   • Хэрэглэгч зөвхөн өөрийн нэрээр санал илгээнэ, бусдынхыг харахгүй.
--   • Багийнхан Supabase Dashboard → Table Editor → app_feedback-ээс уншина.
-- =====================================================================

create table if not exists public.app_feedback (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  role text check (role in ('daughter', 'mother')),
  category text not null check (category in ('idea', 'bug', 'love')),
  rating smallint check (rating between 1 and 5),
  message text not null check (char_length(btrim(message)) between 1 and 1000),
  app_language text check (app_language in ('mn', 'en')),
  created_at timestamptz not null default now()
);

create index if not exists app_feedback_created_idx on public.app_feedback (created_at desc);
create index if not exists app_feedback_user_idx on public.app_feedback (user_id);

alter table public.app_feedback enable row level security;

drop policy if exists "app_feedback: insert own" on public.app_feedback;
create policy "app_feedback: insert own" on public.app_feedback
  for insert to authenticated
  with check (user_id = auth.uid());

-- Зөвхөн өөрийн илгээснийг харна (давтан илгээхээс сэргийлэхэд хэрэгтэй)
drop policy if exists "app_feedback: read own" on public.app_feedback;
create policy "app_feedback: read own" on public.app_feedback
  for select to authenticated
  using (user_id = auth.uid());

-- Засах, устгах эрх өгөхгүй (update/delete policy байхгүй)
revoke update, delete on public.app_feedback from authenticated, anon;
