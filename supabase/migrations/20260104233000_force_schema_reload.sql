-- 1. Garantir que a coluna existe (Backup de segurança)
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS address jsonb DEFAULT '{}'::jsonb;