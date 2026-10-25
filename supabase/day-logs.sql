-- ============================================================
-- Bloomy · Өдрийн бүртгэл (охины календарь) — асран хамгаалагчийн 7 хоногийн тоймд
-- schema.sql-ийн дараа ажиллуулна. Дахин ажиллуулсан ч асуудалгүй.
--
-- Нууцлал:
--   • Зөвхөн ангилсан сонголт хадгална (сэтгэл, шинж, урсгал, арьс, нойр).
--   • Охины ХУВИЙН ТЭМДЭГЛЭЛ (бичвэр) энд огт хадгалагдахгүй — зөвхөн утсан дээр.
--   • Асран хамгаалагч зөвхөн охин «хуваалцах» (share_mood) асаасан үед уншина.
-- ============================================================

create table if not exists public.day_logs (
  user_id    uuid not null references auth.users (id) on delete cascade,
  family_id  uuid references public.families (id) on delete cascade,
  log_date   date not null,
  emotion    text check (emotion  is null or emotion  in ('Happy','Calm','Sad','Anxious','Embarrassed','Irritable')),
  symptoms   text check (symptoms is null or symptoms in ('Cramps','Headache','Bloating','Fatigue','Tenderness')),
  period     text check (period   is null or period   in ('None','Spotting','Light','Medium','Heavy')),
  skin       text check (skin     is null or skin     in ('Clear','Spots','Oily','Dry','Sensitive')),
  sleep      text check (sleep    is null or sleep    in ('Poor','Okay','Good','Great')),
  updated_at timestamptz not null default now(),
  primary key (user_id, log_date)
);

create index if not exists day_logs_family_idx on public.day_logs (family_id, log_date desc);

alter table public.day_logs enable row level security;

drop policy if exists "day_logs: read own or shared" on public.day_logs;
create policy "day_logs: read own or shared" on public.day_logs
  for select to authenticated
  using (
    user_id = auth.uid()
    or (
      family_id = public.my_family_id()
      and public.my_role() = 'mother'
      and exists (select 1 from public.profiles p where p.id = day_logs.user_id and p.share_mood)
    )
  );

drop policy if exists "day_logs: insert own" on public.day_logs;
create policy "day_logs: insert own" on public.day_logs
  for insert to authenticated
  with check (user_id = auth.uid() and public.my_role() = 'daughter' and family_id is not distinct from public.my_family_id());

drop policy if exists "day_logs: update own" on public.day_logs;
create policy "day_logs: update own" on public.day_logs
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and family_id is not distinct from public.my_family_id());

drop policy if exists "day_logs: delete own" on public.day_logs;
create policy "day_logs: delete own" on public.day_logs
  for delete to authenticated using (user_id = auth.uid());

grant select, insert, update, delete on public.day_logs to authenticated;
