
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

const MIGRATION_SQL = `
-- 1. Tabela de Regras de Alocação de Salas
CREATE TABLE IF NOT EXISTS public.scheduling_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    organization_id UUID,
    professional_id UUID,
    service_keyword TEXT,
    location_id UUID NOT NULL,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.scheduling_rules ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'scheduling_rules' AND policyname = 'Enable all access for authenticated users'
    ) THEN
        CREATE POLICY "Enable all access for authenticated users" ON public.scheduling_rules
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END
$$;

-- 2. Colunas para Agenda Inteligente e Trial
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS smart_scheduling_mode TEXT DEFAULT 'open',
ADD COLUMN IF NOT EXISTS anchor_times TEXT[] DEFAULT ARRAY['08:00', '14:00'],
ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- 3. Atualizar Trigger para 14 Dias Grátis
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    default_org_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
    INSERT INTO public.profiles (
        id, full_name, email, organization_id, role, photo_url, trial_ends_at
    )
    VALUES (
        NEW.id, 
        NEW.raw_user_meta_data->>'full_name', 
        NEW.email, 
        default_org_id, 
        'admin', 
        NEW.raw_user_meta_data->>'avatar_url',
        NOW() + INTERVAL '14 days' -- [NEW] 14 Days Free
    )
    ON CONFLICT (id) DO UPDATE
    SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;
        
    RETURN NEW;
END;
$function$;
`;

export async function GET() {
    try {
        await db.query(MIGRATION_SQL);
        return NextResponse.json({ success: true, message: "Migration applied! (Sched rules + Smart Mode + Asaas + Trial Trigger)" });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
