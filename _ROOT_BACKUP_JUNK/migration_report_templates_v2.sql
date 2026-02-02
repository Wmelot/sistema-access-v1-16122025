-- Add content and category columns to report_templates
ALTER TABLE public.report_templates 
ADD COLUMN IF NOT EXISTS content JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';

-- Add index for category for faster filtering
CREATE INDEX IF NOT EXISTS idx_report_templates_category ON public.report_templates(category);
