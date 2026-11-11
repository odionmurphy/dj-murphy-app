create table if not exists public.mix_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  file_path text not null unique,
  size_bytes bigint not null check (size_bytes > 0),
  created_at timestamptz not null default now()
);

create index if not exists mix_videos_created_at_idx
on public.mix_videos (created_at desc);

alter table public.mix_videos enable row level security;

grant select on public.mix_videos to anon, authenticated;
grant insert, update, delete on public.mix_videos to authenticated;

drop policy if exists "Public can view live-set videos" on public.mix_videos;
create policy "Public can view live-set videos"
on public.mix_videos for select
to anon, authenticated
using (true);

drop policy if exists "Admins can add live-set videos" on public.mix_videos;
create policy "Admins can add live-set videos"
on public.mix_videos for insert
to authenticated
with check (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Admins can update live-set videos" on public.mix_videos;
create policy "Admins can update live-set videos"
on public.mix_videos for update
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

drop policy if exists "Admins can delete live-set videos" on public.mix_videos;
create policy "Admins can delete live-set videos"
on public.mix_videos for delete
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

notify pgrst, 'reload schema';
