-- 1. Add new permission for Financial Transparency
INSERT INTO public.permissions (code, description, module)
VALUES 
('financial.transparency_view', 'Visualizar Resumo Financeiro (Sem Detalhes)', 'Financeiro')
ON CONFLICT (code) DO NOTHING;

-- 2. Add Owner and Visibility to Form Templates
ALTER TABLE public.form_templates 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS visibility_level TEXT DEFAULT 'private'; -- 'private', 'team', 'public'

-- 3. Comment explaining columns
COMMENT ON COLUMN public.form_templates.owner_id IS 'User ID of the creator. Only they (or Master) can edit/delete.';
COMMENT ON COLUMN public.form_templates.visibility_level IS 'Controls who can USE this form. private=owner only, team=organization.';
