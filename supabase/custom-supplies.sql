-- Run this in the Supabase SQL editor to enable custom family supply items.
alter table public.supplies add column if not exists label text;
alter table public.supplies add column if not exists emoji text;

drop policy if exists "supplies: family insert" on public.supplies;
create policy "supplies: family insert" on public.supplies
  for insert to authenticated
  with check (family_id = public.my_family_id());

drop policy if exists "supplies: family delete" on public.supplies;
create policy "supplies: family delete" on public.supplies
  for delete to authenticated using (family_id = public.my_family_id());
