-- Create table for Women's Health and Pelvic Assessments (Saúde da Mulher & Pélvica)
CREATE TABLE IF NOT EXISTS public.womens_health_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id), -- SaaS readiness
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.womens_health_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view womens_health_assessments in their organization"
    ON public.womens_health_assessments FOR SELECT
    USING (
        organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
        OR 
        (organization_id IS NULL AND auth.uid() IN (SELECT id FROM public.profiles)) -- Legacy/Fallback
    );

CREATE POLICY "Users can insert womens_health_assessments in their organization"
    ON public.womens_health_assessments FOR INSERT
    WITH CHECK (
        organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can update womens_health_assessments in their organization"
    ON public.womens_health_assessments FOR UPDATE
    USING (
        organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can delete womens_health_assessments in their organization"
    ON public.womens_health_assessments FOR DELETE
    USING (
        organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    );

-- Trigger for updated_at
CREATE TRIGGER update_womens_health_assessments_modtime
    BEFORE UPDATE ON public.womens_health_assessments
    FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
