-- Recommended for existing projects: enforce selected-daughter delivery in RLS.
-- The app has a compatible fallback when recipient_id has not been added yet.

alter table public.notifications
  add column if not exists recipient_id uuid references public.profiles (id) on delete set null;

create index if not exists notifications_recipient_idx
  on public.notifications (recipient_id, created_at desc);

drop policy if exists "notif: read mine" on public.notifications;
create policy "notif: read mine" on public.notifications
  for select to authenticated
  using (
    family_id = public.my_family_id()
    and recipient_role = public.my_role()
    and (
      public.my_role() = 'mother'
      or recipient_id = auth.uid()
      or (
        recipient_id is null
        and (kind not like 'target:%' or split_part(kind, ':', 2) = auth.uid()::text)
      )
    )
  );

drop policy if exists "notif: send to family" on public.notifications;
create policy "notif: send to family" on public.notifications
  for insert to authenticated
  with check (
    family_id = public.my_family_id()
    and sender_id = auth.uid()
    and (
      recipient_id is null
      or (
        public.my_role() = 'mother'
        and exists (
          select 1 from public.profiles p
          where p.id = recipient_id
            and p.family_id = public.my_family_id()
            and p.role = recipient_role
        )
      )
    )
  );

drop policy if exists "notif: mark read" on public.notifications;
create policy "notif: mark read" on public.notifications
  for update to authenticated
  using (
    family_id = public.my_family_id()
    and recipient_role = public.my_role()
    and (
      public.my_role() = 'mother'
      or recipient_id = auth.uid()
      or (
        recipient_id is null
        and (kind not like 'target:%' or split_part(kind, ':', 2) = auth.uid()::text)
      )
    )
  )
  with check (
    family_id = public.my_family_id()
    and recipient_role = public.my_role()
    and (
      public.my_role() = 'mother'
      or recipient_id = auth.uid()
      or (
        recipient_id is null
        and (kind not like 'target:%' or split_part(kind, ':', 2) = auth.uid()::text)
      )
    )
  );
