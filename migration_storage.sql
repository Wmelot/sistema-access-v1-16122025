-- Create the 'logos' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- Set up policies for the 'logos' bucket
create policy "Public Access to Logos"
  on storage.objects for select
  using ( bucket_id = 'logos' );

create policy "Authenticated users can upload logos"
  on storage.objects for insert
  with check ( bucket_id = 'logos' and auth.role() = 'authenticated' );

create policy "Authenticated users can update logos"
  on storage.objects for update
  using ( bucket_id = 'logos' and auth.role() = 'authenticated' );

create policy "Authenticated users can delete logos"
  on storage.objects for delete
  using ( bucket_id = 'logos' and auth.role() = 'authenticated' );
