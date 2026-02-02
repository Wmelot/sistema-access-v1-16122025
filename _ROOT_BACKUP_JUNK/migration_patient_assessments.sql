-- Create patient_assessments table
create table if not exists patient_assessments (
    id uuid default gen_random_uuid() primary key,
    patient_id uuid references patients(id) on delete cascade not null,
    professional_id uuid references profiles(id) on delete set null,
    type text not null, -- 'start_back', 'mcgill_short', 'tampa_kinesiophobia', 'mhlc', 'quickdash', 'lefs'
    data jsonb not null default '{}'::jsonb, -- Raw answers
    scores jsonb not null default '{}'::jsonb, -- Calculated scores
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add index for faster lookups
create index if not exists idx_patient_assessments_patient_id on patient_assessments(patient_id);
create index if not exists idx_patient_assessments_type on patient_assessments(type);

-- Enable RLS
alter table patient_assessments enable row level security;

-- Policies
drop policy if exists "Authenticated users can view assessments" on patient_assessments;
create policy "Authenticated users can view assessments"
    on patient_assessments for select
    to authenticated
    using (true);

drop policy if exists "Authenticated users can create assessments" on patient_assessments;
create policy "Authenticated users can create assessments"
    on patient_assessments for insert
    to authenticated
    with check (true);

drop policy if exists "Authenticated users can update assessments" on patient_assessments;
create policy "Authenticated users can update assessments"
    on patient_assessments for update
    to authenticated
    using (true);

drop policy if exists "Authenticated users can delete assessments" on patient_assessments;
create policy "Authenticated users can delete assessments"
    on patient_assessments for delete
    to authenticated
    using (true);

-- Updated_at trigger
drop trigger if exists update_patient_assessments_modtime on patient_assessments;
create trigger update_patient_assessments_modtime
    before update on patient_assessments
    for each row
    execute function update_updated_at_column();
