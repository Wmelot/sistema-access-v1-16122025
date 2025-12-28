-- Create report_templates table for document/report templates feature

CREATE TABLE IF NOT EXISTS public.report_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'report', -- 'report', 'prescription', 'certificate', etc
    category TEXT DEFAULT 'Laudos', -- 'Laudos', 'Receitas', 'Atestados', etc
    content TEXT NOT NULL, -- Template content with variables like {{patient_name}}
    config JSONB DEFAULT '{}'::jsonb -- Additional configuration (fonts, margins, etc)
);

-- Enable RLS
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view report templates"
    ON public.report_templates FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert report templates"
    ON public.report_templates FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own report templates"
    ON public.report_templates FOR UPDATE
    USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete own report templates"
    ON public.report_templates FOR DELETE
    USING (auth.uid() = profile_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_report_templates_profile_id 
    ON public.report_templates(profile_id);

CREATE INDEX IF NOT EXISTS idx_report_templates_category 
    ON public.report_templates(category);

-- Reload Schema
NOTIFY pgrst, 'reload config';
