-- Create 'documents' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

-- Ensure RLS is enabled on storage.objects
alter table storage.objects enable row level security;

-- Policy: Allow Authenticated Users to Upload to 'documents' bucket
create policy "Authenticated users can upload documents"
on storage.objects for insert
with check ( bucket_id = 'documents' and auth.role() = 'authenticated' );

-- Policy: Allow Authenticated Users to Select from 'documents' bucket
create policy "Authenticated users can select documents"
on storage.objects for select
using ( bucket_id = 'documents' and auth.role() = 'authenticated' );

-- Create patient_documents table
create table if not exists public.patient_documents (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  
  organization_id uuid not null references public.organizations(id),
  patient_id uuid not null references public.patients(id) on delete cascade,
  
  title text not null,
  url text not null, -- Storage Path or Full URL
  type text default 'document', -- 'document', 'image', 'exam'
  size_bytes bigint,
  
  created_by uuid references auth.users(id)
);

-- Enable RLS
alter table public.patient_documents enable row level security;

-- RLS Policies for patient_documents
create policy "Users can view documents from their organization"
  on public.patient_documents for select
  using (
    organization_id = (select organization_id from public.profiles where id = auth.uid())
  );

create policy "Users can insert documents for their organization"
  on public.patient_documents for insert
  with check (
    organization_id = (select organization_id from public.profiles where id = auth.uid())
  );

create policy "Users can update documents for their organization"
  on public.patient_documents for update
  using (
    organization_id = (select organization_id from public.profiles where id = auth.uid())
  );

create policy "Users can delete documents for their organization"
  on public.patient_documents for delete
  using (
    organization_id = (select organization_id from public.profiles where id = auth.uid())
  );
