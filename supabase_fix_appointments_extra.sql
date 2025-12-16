-- Add is_extra (encaixe) flag to appointments
alter table public.appointments 
add column if not exists is_extra boolean default false;

notify pgrst, 'reload config';
