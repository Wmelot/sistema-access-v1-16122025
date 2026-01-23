
-- Add visibility_level to form_templates
ALTER TABLE public.form_templates 
ADD COLUMN IF NOT EXISTS visibility_level TEXT DEFAULT 'private' CHECK (visibility_level IN ('private', 'public', 'assigned'));

-- Create assignment table
CREATE TABLE IF NOT EXISTS public.organization_form_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    form_template_id UUID REFERENCES public.form_templates(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, form_template_id)
);

-- Enable RLS
ALTER TABLE public.organization_form_access ENABLE ROW LEVEL SECURITY;

-- 1. Policies for organization_form_access
-- Master: All access
DROP POLICY IF EXISTS "Master Access to Assignments" ON public.organization_form_access;
CREATE POLICY "Master Access to Assignments" ON public.organization_form_access
FOR ALL
USING (
   EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND organization_id = '00000000-0000-0000-0000-000000000001' -- Master Org ID
   )
);

-- Clinics: View assigned to them (not needed much directly, but good to have)
DROP POLICY IF EXISTS "Clinics View Assignments" ON public.organization_form_access;
CREATE POLICY "Clinics View Assignments" ON public.organization_form_access
FOR SELECT
USING (
   organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);


-- 2. UPDATED Policies for form_templates
DROP POLICY IF EXISTS "Users can view form_templates from their organization" ON public.form_templates;

-- Complex View Policy
CREATE POLICY "Form Visibility Policy" ON public.form_templates
FOR SELECT
USING (
  -- 1. Allow Master Org to see EVERYTHING
  (organization_id = '00000000-0000-0000-0000-000000000001' AND 
   EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND organization_id = '00000000-0000-0000-0000-000000000001'))
  OR
  -- 2. Allow if Public
  (visibility_level = 'public')
  OR
  -- 3. Allow if Private/Assigned AND belongs to my org
  (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  OR
  -- 4. Allow if Assigned specifically to my org
  (id IN (
    SELECT form_template_id 
    FROM public.organization_form_access 
    WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  ))
);

-- Update/Delete Policy (Restrict to Creator Org OR Master)
DROP POLICY IF EXISTS "Users can update form_templates for their organization" ON public.form_templates;
CREATE POLICY "Form Update Policy" ON public.form_templates
FOR UPDATE
USING (
   (organization_id = '00000000-0000-0000-0000-000000000001' AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND organization_id = '00000000-0000-0000-0000-000000000001'))
   OR
   (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
);

DROP POLICY IF EXISTS "Users can delete form_templates for their organization" ON public.form_templates;
CREATE POLICY "Form Delete Policy" ON public.form_templates
FOR DELETE
USING (
   (organization_id = '00000000-0000-0000-0000-000000000001' AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND organization_id = '00000000-0000-0000-0000-000000000001'))
   OR
   (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
);

-- Insert Policy
DROP POLICY IF EXISTS "Users can insert form_templates for their organization" ON public.form_templates;
CREATE POLICY "Form Insert Policy" ON public.form_templates
FOR INSERT
WITH CHECK (
   -- Anyone can insert for their own org
   organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);
