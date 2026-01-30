-- ============================================
-- 🛠️ FIX: CREATE PROFESSIONAL INTEGRATIONS TABLE
-- ============================================
-- Execute este SQL no "SQL Editor" do seu Supabase
-- para corrigir o erro PGRST205 (Tabela não encontrada)
-- ============================================

CREATE TABLE IF NOT EXISTS public.professional_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expiry_date BIGINT, -- Armazena o timestamp de expiração (Unix)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Garante que um profissional só tenha uma integração por provedor
    UNIQUE(profile_id, provider)
);

-- Ativar RLS (Segurança)
ALTER TABLE public.professional_integrations ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Users can manage their own integrations" 
ON public.professional_integrations
FOR ALL 
USING (auth.uid() = profile_id);

CREATE POLICY "Admins can view all integrations" 
ON public.professional_integrations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Comando para limpar o cache do Supabase e reconhecer a nova tabela
NOTIFY pgrst, 'reload schema';
