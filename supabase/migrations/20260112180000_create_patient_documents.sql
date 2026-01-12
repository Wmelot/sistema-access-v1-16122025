-- 20260112180000_create_patient_documents.sql

-- 1. Ensure Storage Bucket exists
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

-- 2. Storage Policies (Safe creation)
DO $$
BEGIN
    create policy "Authenticated users can upload documents"
    on storage.objects for insert
    with check ( bucket_id = 'documents' and auth.role() = 'authenticated' );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    create policy "Authenticated users can select documents"
    on storage.objects for select
    using ( bucket_id = 'documents' and auth.role() = 'authenticated' );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Create Patient Documents Table
create table if not exists public.patient_documents (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  organization_id uuid not null references public.organizations(id),
  patient_id uuid not null references public.patients(id) on delete cascade,
  title text not null,
  url text not null,
  type text default 'document',
  size_bytes bigint,
  created_by uuid references auth.users(id)
);

alter table public.patient_documents enable row level security;

-- 4. RLS Policies (Safe creation)
DO $$
BEGIN
    create policy "Users can view documents from their organization"
      on public.patient_documents for select
      using (organization_id = (select organization_id from public.profiles where id = auth.uid()));

    create policy "Users can insert documents for their organization"
      on public.patient_documents for insert
      with check (organization_id = (select organization_id from public.profiles where id = auth.uid()));
      
    create policy "Users can update documents for their organization"
      on public.patient_documents for update
      using (organization_id = (select organization_id from public.profiles where id = auth.uid()));
      
    create policy "Users can delete documents for their organization"
      on public.patient_documents for delete
      using (organization_id = (select organization_id from public.profiles where id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
