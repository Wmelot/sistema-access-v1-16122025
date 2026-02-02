
-- REFRESH PATIENTS CACHE & FIX APPOINTMENTS
-- 1. Você confirmou: A coluna 'gender' EXISTE.
-- 2. O erro diz: "does not exist".
-- CONCLUSÃO: O cache do Supabase está mentindo. Vamos forçar a atualização dele na tabela patients.

BEGIN;

-- Forçar atualização do Schema Cache para Pacientes e Agendamentos
COMMENT ON TABLE public.patients IS 'Schema Refresh Triggered by Fix - Link to Gender';
COMMENT ON TABLE public.appointments IS 'Schema Refresh Triggered by Fix';

-- Prevenção: Garantir que Agendamentos também tenham vínculo com o Master
-- (Eu arrumei pacientes e avaliações antes, agora vou garantir agendamentos)
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';

UPDATE public.appointments 
SET organization_id = '00000000-0000-0000-0000-000000000001' 
WHERE organization_id IS NULL;

COMMIT;

-- Tenta o reload
NOTIFY pgrst, 'reload config';
