alter table public.gigs
add column if not exists image_path text;

alter table public.gigs enable row level security;

drop policy if exists "Public can view gigs" on public.gigs;
create policy "Public can view gigs"
on public.gigs for select
to anon, authenticated
using (true);

drop policy if exists "Admins can insert gigs" on public.gigs;
create policy "Admins can insert gigs"
on public.gigs for insert
to authenticated
with check (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Admins can update gigs" on public.gigs;
create policy "Admins can update gigs"
on public.gigs for update
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Admins can delete gigs" on public.gigs;
create policy "Admins can delete gigs"
on public.gigs for delete
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'gig-images',
  'gig-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view gig images" on storage.objects;
create policy "Public can view gig images"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'gig-images');

drop policy if exists "Admins can upload gig images" on storage.objects;
create policy "Admins can upload gig images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'gig-images'
  and exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Admins can update gig images" on storage.objects;
create policy "Admins can update gig images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'gig-images'
  and exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
)
with check (
  bucket_id = 'gig-images'
  and exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Admins can delete gig images" on storage.objects;
create policy "Admins can delete gig images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'gig-images'
  and exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);
