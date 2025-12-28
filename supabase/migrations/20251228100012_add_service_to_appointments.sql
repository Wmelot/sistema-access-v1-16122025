-- Add service_id to appointments table for billing functionality

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id);

-- Reload Schema
NOTIFY pgrst, 'reload config';
