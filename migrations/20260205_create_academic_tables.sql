-- Migration: Academic Portal (SINAES) Tables
-- Tables for PUC Minas Physical Therapy Evidence Tracking

CREATE TABLE IF NOT EXISTS public.acad_registros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    professor_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('ENSINO', 'PESQUISA', 'EXTENSÃO')),
    type_id UUID,
    description TEXT,
    impact TEXT,
    integration JSONB DEFAULT '[]',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'finalized')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.acad_tipos_atividade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('ENSINO', 'PESQUISA', 'EXTENSÃO')),
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.acad_midias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registro_id UUID REFERENCES public.acad_registros(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    storage_path TEXT,
    media_type TEXT, -- 'image', 'video', 'pdf'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.acad_registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acad_tipos_atividade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acad_midias ENABLE ROW LEVEL SECURITY;

-- Insert default types for each category (SINAES Standard)
INSERT INTO public.acad_tipos_atividade (name, category, is_system) VALUES
-- ENSINO
('Ata de Aula', 'ENSINO', true),
('Simulação Clínica', 'ENSINO', true),
('Projeto Integrador', 'ENSINO', true),
('Sala de Aula Invertida', 'ENSINO', true),
('Estudo de Caso', 'ENSINO', true),
-- PESQUISA
('Projeto FIP/PIBIC/PIC-IV', 'PESQUISA', true),
('Orientação de TCC', 'PESQUISA', true),
('Prática Investigativa', 'PESQUISA', true),
('Publicação de Artigo', 'PESQUISA', true),
-- EXTENSÃO
('Projeto de Extensão (Edital)', 'EXTENSÃO', true),
('Atividade vinculada à UC', 'EXTENSÃO', true),
('Evento de Extensão', 'EXTENSÃO', true);
