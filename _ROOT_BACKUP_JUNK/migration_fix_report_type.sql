-- Drop the restrictive constraint
ALTER TABLE public.report_templates DROP CONSTRAINT IF EXISTS report_templates_type_check;

-- Add it back with 'smart_report' included
ALTER TABLE public.report_templates 
ADD CONSTRAINT report_templates_type_check 
CHECK (type IN ('text', 'custom', 'smart_report', 'laudo', 'atestado', 'encaminhamento'));
