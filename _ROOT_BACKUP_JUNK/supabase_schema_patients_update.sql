-- Add new columns to patients table

-- 1. Human readable Record Code (Prontuário #)
-- We use a sequence to generate a friendly number
create sequence if not exists public.patient_record_seq start 1000;

alter table public.patients 
add column if not exists record_code integer default nextval('public.patient_record_seq'),
add column if not exists occupation text,
add column if not exists marketing_source text,
add column if not exists related_patient_id uuid references public.patients(id),
add column if not exists relationship_degree text;

-- Add index for record_code
create unique index if not exists patients_record_code_idx on public.patients(record_code);

-- Update RLS to ensure these are accessible (policies usually cover 'all', but good to double check if we restricted columns - we didn't).
