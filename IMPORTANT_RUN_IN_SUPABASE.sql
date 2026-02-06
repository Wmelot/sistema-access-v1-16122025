-- COPIE E COLE ESTE CÓDIGO NO SQL EDITOR DO SEU SUPABASE
-- ISSO LIBERA AS PERMISSÕES QUE ESTÃO BLOQUEANDO SEUS DADOS

-- 1. Liberar Registros Acadêmicos
ALTER TABLE public.acad_registros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permissao Total Docentes" ON public.acad_registros;
CREATE POLICY "Permissao Total Docentes" ON public.acad_registros 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Liberar Mídias (Fotos)
ALTER TABLE public.acad_midias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permissao Total Midias" ON public.acad_midias;
CREATE POLICY "Permissao Total Midias" ON public.acad_midias 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Liberar Tipos de Atividade
ALTER TABLE public.acad_tipos_atividade ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permissao Total Tipos" ON public.acad_tipos_atividade;
CREATE POLICY "Permissao Total Tipos" ON public.acad_tipos_atividade 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Garantir Docentes
ALTER TABLE public.academic_professors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permissao Total Professores" ON public.academic_professors;
CREATE POLICY "Permissao Total Professores" ON public.academic_professors 
FOR ALL TO authenticated USING (true) WITH CHECK (true);
