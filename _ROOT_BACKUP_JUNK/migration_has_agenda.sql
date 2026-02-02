-- Add has_agenda column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_agenda boolean DEFAULT true;
