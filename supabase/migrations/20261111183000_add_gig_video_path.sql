alter table public.gigs
add column if not exists video_path text;

notify pgrst, 'reload schema';
