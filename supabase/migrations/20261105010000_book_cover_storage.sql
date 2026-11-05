insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'book-covers',
  'book-covers',
  true,
  5242880,
  array['image/jpeg', 'image/png']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Book covers are publicly readable"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'book-covers');

create policy "Staff can upload book covers"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'book-covers'
    and coalesce(public.app_role(), '') in ('admin', 'super_admin')
  );

create policy "Staff can update book covers"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'book-covers'
    and coalesce(public.app_role(), '') in ('admin', 'super_admin')
  )
  with check (
    bucket_id = 'book-covers'
    and coalesce(public.app_role(), '') in ('admin', 'super_admin')
  );

create policy "Staff can delete book covers"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'book-covers'
    and coalesce(public.app_role(), '') in ('admin', 'super_admin')
  );
