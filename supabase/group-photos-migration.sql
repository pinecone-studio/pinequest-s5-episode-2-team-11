-- Group photos are stored privately and served only after a live membership check.

create or replace function public.is_group_member(p_group uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.role = 'daughter'
    )
    and exists (
      select 1
      from public.friend_groups g
      where g.id = p_group
        and (
          g.owner_id = auth.uid()
          or exists (
            select 1
            from public.friend_group_members m
            where m.group_id = g.id and m.member_id = auth.uid()
          )
        )
    )
$$;

create or replace function public.is_group_admin(p_group uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.friend_groups
    where id = p_group and owner_id = auth.uid()
  )
$$;

grant execute on function public.is_group_member(uuid) to authenticated;
grant execute on function public.is_group_admin(uuid) to authenticated;

drop policy if exists "groups: members read" on public.friend_groups;
create policy "groups: members read" on public.friend_groups
  for select to authenticated using (public.is_group_member(id));

drop policy if exists "members: group members read" on public.friend_group_members;
create policy "members: group members read" on public.friend_group_members
  for select to authenticated using (public.is_group_member(group_id));

do $$
declare t text;
begin
  foreach t in array array['friend_groups', 'friend_group_members'] loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

create table if not exists public.group_photos (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.friend_groups (id) on delete cascade,
  uploader_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists group_photos_feed_idx
  on public.group_photos (group_id, created_at desc, id desc);

alter table public.group_photos enable row level security;

drop policy if exists "group photos: members read" on public.group_photos;
create policy "group photos: members read" on public.group_photos
  for select to authenticated using (public.is_group_member(group_id));

drop policy if exists "group photos: members post as self" on public.group_photos;
create policy "group photos: members post as self" on public.group_photos
  for insert to authenticated
  with check (uploader_id = auth.uid() and public.is_group_member(group_id));

drop policy if exists "group photos: uploader or admin delete" on public.group_photos;
create policy "group photos: uploader or admin delete" on public.group_photos
  for delete to authenticated
  using (uploader_id = auth.uid() or public.is_group_admin(group_id));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('group-photos', 'group-photos', false, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "group photo objects: current members read" on storage.objects;
create policy "group photo objects: current members read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'group-photos'
    and exists (
      select 1
      from public.group_photos photo
      where photo.storage_path = storage.objects.name
        and public.is_group_member(photo.group_id)
    )
  );
