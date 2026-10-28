-- Bloomy Plus — асран хамгаалагчийн идэвхжүүлдэг premium эрх (ДЕМО: жинхэнэ төлбөргүй).
-- Premium хувцсыг зөвхөн идэвхтэй эрхтэй охин 🌸 дэлбээгээр авна.
-- Бичих эрх зөвхөн /api/premium (service role) — охин өөрөө өөртөө эрх өгч чадахгүй.

create table if not exists public.premium_subscriptions (
  child_id   uuid primary key references public.profiles (id) on delete cascade,
  plan       text not null default 'bloomy_plus' check (plan in ('bloomy_plus')),
  active     boolean not null default false,
  started_at timestamptz,
  expires_at timestamptz,
  granted_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.premium_subscriptions enable row level security;

-- Охин өөрийнхийгөө, асран хамгаалагч гэр бүлийнхээ охидынхыг уншина
drop policy if exists "premium: read own or family child" on public.premium_subscriptions;
create policy "premium: read own or family child" on public.premium_subscriptions
  for select to authenticated
  using (
    child_id = auth.uid()
    or (
      public.my_role() = 'mother'
      and exists (
        select 1 from public.profiles p
        where p.id = child_id and p.family_id = public.my_family_id()
      )
    )
  );
-- insert/update/delete бодлого байхгүй → зөвхөн service role бичнэ
