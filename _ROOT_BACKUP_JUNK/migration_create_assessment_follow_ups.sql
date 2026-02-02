-- Create the assessment_follow_ups table
CREATE TABLE IF NOT EXISTS public.assessment_follow_ups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.form_templates(id) ON DELETE SET NULL, 
    original_assessment_id UUID REFERENCES public.patient_assessments(id) ON DELETE SET NULL,
    scheduled_for TIMESTAMPTZ NOT NULL,
    custom_message TEXT,
    link_expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'completed')),
    link_token UUID DEFAULT gen_random_uuid() UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_assessment_follow_ups_patient_id ON public.assessment_follow_ups(patient_id);
CREATE INDEX IF NOT EXISTS idx_assessment_follow_ups_scheduled_for ON public.assessment_follow_ups(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_assessment_follow_ups_link_token ON public.assessment_follow_ups(link_token);
CREATE INDEX IF NOT EXISTS idx_assessment_follow_ups_status ON public.assessment_follow_ups(status);

-- Enable RLS
ALTER TABLE public.assessment_follow_ups ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view follow ups they created or if admin" ON public.assessment_follow_ups
    FOR SELECT
    USING (true); 

CREATE POLICY "Users can insert follow ups" ON public.assessment_follow_ups
    FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update follow ups" ON public.assessment_follow_ups
    FOR UPDATE
    USING (auth.uid() = created_by OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'master', 'physiotherapist')
    ));

CREATE POLICY "Users can delete follow ups" ON public.assessment_follow_ups
    FOR DELETE
    USING (auth.uid() = created_by OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'master')
    ));
