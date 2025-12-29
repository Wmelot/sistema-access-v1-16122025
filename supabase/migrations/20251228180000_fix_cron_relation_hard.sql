-- fix_cron_relation_hard.sql

-- 1. Drop the column (and constraint) if exists to clean state
ALTER TABLE public.assessment_follow_ups 
DROP COLUMN IF EXISTS template_id CASCADE;

-- 2. Re-add the column with explicit foreign key
ALTER TABLE public.assessment_follow_ups 
ADD COLUMN template_id UUID REFERENCES public.message_templates(id);

-- 3. Notify reload just in case
NOTIFY pgrst, 'reload schema';
