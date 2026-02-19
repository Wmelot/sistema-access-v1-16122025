CREATE TABLE IF NOT EXISTS public.organization_message_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    message_template_id UUID NOT NULL REFERENCES public.message_templates(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(organization_id, message_template_id)
);

ALTER TABLE public.organization_message_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin all access org_msg_access" ON public.organization_message_access
    AS PERMISSIVE FOR ALL
    TO authenticated
    USING ((EXISTS ( SELECT 1 FROM public.profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'master'::text)))));

CREATE POLICY "Users can view their orgs msg access" ON public.organization_message_access
    FOR SELECT TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
        UNION
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));

-- Also, need to insert existing templates access for existing organizations to avoid breaking them immediately? 
-- The user said: "que possa selecionar quais mensagem uma clinica vai ter já aparecendo no sistema e quais ele não vai ver"
