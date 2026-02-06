-- Migration: Fix RLS Policies for Academic (SINAES) Table
-- Allow authenticated users to manage their own organization's data

-- 1. acad_registros
DROP POLICY IF EXISTS "Users can manage their organization's records" ON public.acad_registros;
CREATE POLICY "Users can manage their organization's records" 
ON public.acad_registros 
FOR ALL 
TO authenticated 
USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 2. acad_midias
DROP POLICY IF EXISTS "Users can manage their organization's media" ON public.acad_midias;
CREATE POLICY "Users can manage their organization's media" 
ON public.acad_midias 
FOR ALL 
TO authenticated 
USING (registro_id IN (SELECT id FROM public.acad_registros))
WITH CHECK (registro_id IN (SELECT id FROM public.acad_registros));

-- 3. acad_tipos_atividade
DROP POLICY IF EXISTS "Users can view all activity types" ON public.acad_tipos_atividade;
CREATE POLICY "Users can view all activity types" 
ON public.acad_tipos_atividade 
FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Admins can manage activity types" ON public.acad_tipos_atividade;
CREATE POLICY "Admins can manage activity types" 
ON public.acad_tipos_atividade 
FOR ALL 
TO authenticated 
USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 4. academic_professors (Ensure this table also has proper policies)
ALTER TABLE public.academic_professors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their organization's professors" ON public.academic_professors;
CREATE POLICY "Users can manage their organization's professors" 
ON public.academic_professors 
FOR ALL 
TO authenticated 
USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
