-- Add service_id to appointments table
alter table public.appointments 
add column if not exists service_id uuid references public.services(id);

-- Notify PostgREST to reload schema
notify pgrst, 'reload config';
