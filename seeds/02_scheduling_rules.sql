-- 1. Tabela de Regras de Alocação de Salas
-- Define para onde cada agendamento vai baseada em critérios
CREATE TABLE IF NOT EXISTS public.scheduling_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    organization_id UUID REFERENCES public.organizations(id),
    
    -- Critérios (NULL funciona como curinga/wildcard)
    professional_id UUID REFERENCES public.profiles(id),
    service_keyword TEXT, -- Ex: 'Pélvica', 'Consulta', 'Palmilha'
    
    -- Destino (Obrigatório)
    location_id UUID REFERENCES public.locations(id) NOT NULL,
    
    -- Configuração
    priority INTEGER DEFAULT 0, -- Regras com maior prioridade sobrescrevem as menores
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.scheduling_rules ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS (Permitir tudo para autenticados por enquanto, ajustar depois p/ admin)
CREATE POLICY "Enable all access for authenticated users" ON public.scheduling_rules
    FOR ALL USING (auth.role() = 'authenticated');


-- 2. Colunas para Agenda Inteligente na tabela Profiles
-- Adiciona configurações individuais de otimização
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS smart_scheduling_mode TEXT DEFAULT 'open', -- 'open', 'optimized', 'strict'
ADD COLUMN IF NOT EXISTS anchor_times TEXT[] DEFAULT ARRAY['08:00', '14:00']; -- Horários âncora para dias vazios
