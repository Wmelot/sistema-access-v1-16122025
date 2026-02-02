-- Migration to add 'appointment_type' to appointments table
-- Run this in your Supabase SQL Editor

ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS type text default 'appointment' CHECK (type IN ('appointment', 'block'));

-- Update existing rows to be 'appointment'
UPDATE public.appointments SET type = 'appointment' WHERE type IS NULL;
