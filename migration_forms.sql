-- Create table for Form Templates (the structure of the forms)
create table if not exists form_templates (
    id uuid primary key default gen_random_uuid(),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    title text not null,
    description text,
    fields jsonb not null default '[]'::jsonb, -- Array of field definitions
    is_active boolean default true,
    user_id uuid references auth.users(id) -- Optional: who created the template
);

-- Create table for Patient Records (filled forms)
create table if not exists patient_records (
    id uuid primary key default gen_random_uuid(),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    patient_id uuid not null, -- Assuming there is a patients table, add fk if exists: references patients(id)
    template_id uuid references form_templates(id),
    content jsonb not null default '{}'::jsonb, -- Key-value pairs of answers
    ai_summary text, -- To store the generated text from AI
    professional_id uuid references auth.users(id) -- Who filled the form
);

-- Enable RLS
alter table form_templates enable row level security;
alter table patient_records enable row level security;

-- Policies for Form Templates
create policy "Authenticated users can view templates"
    on form_templates for select
    using (auth.role() = 'authenticated');

create policy "Authenticated users can create templates"
    on form_templates for insert
    with check (auth.role() = 'authenticated');

create policy "Authenticated users can update templates"
    on form_templates for update
    using (auth.role() = 'authenticated');

-- Policies for Patient Records
create policy "Authenticated users can view records"
    on patient_records for select
    using (auth.role() = 'authenticated');

create policy "Authenticated users can create records"
    on patient_records for insert
    with check (auth.role() = 'authenticated');

create policy "Authenticated users can update records"
    on patient_records for update
    using (auth.role() = 'authenticated');

-- Add 'Settings' link/permission if needed, but RLS covers basic auth.
