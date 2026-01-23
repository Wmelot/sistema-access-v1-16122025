
-- Add organization_id to form_templates
ALTER TABLE public.form_templates 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_form_templates_organization ON public.form_templates(organization_id);

-- Enable RLS (if not already)
ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS Policy for isolation
DROP POLICY IF EXISTS "Users can view form_templates from their organization" ON public.form_templates;

CREATE POLICY "Users can view form_templates from their organization"
ON public.form_templates
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert form_templates for their organization" ON public.form_templates;

CREATE POLICY "Users can insert form_templates for their organization"
ON public.form_templates
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update form_templates for their organization" ON public.form_templates;

CREATE POLICY "Users can update form_templates for their organization"
ON public.form_templates
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete form_templates for their organization" ON public.form_templates;

CREATE POLICY "Users can delete form_templates for their organization"
ON public.form_templates
FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
);
