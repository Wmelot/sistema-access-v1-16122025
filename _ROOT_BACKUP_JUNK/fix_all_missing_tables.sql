-- MASTER FIX SCRIPT
-- This script safely creates missing tables and fixes permissions.
-- Run this in Supabase SQL Editor.

-- 1. CLINIC SETTINGS (Missing relation 'clinic_settings' fix)
CREATE TABLE IF NOT EXISTS public.clinic_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL DEFAULT 'Minha Clínica',
    cnpj TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    address JSONB DEFAULT '{}'::jsonb,
    logo_url TEXT,
    document_logo_url TEXT, -- Specific for reports
    primary_color TEXT DEFAULT '#84c8b9',
    is_active BOOLEAN DEFAULT true
);

-- Seed Clinic Settings if empty
INSERT INTO public.clinic_settings (name)
SELECT 'Access Fisioterapia'
WHERE NOT EXISTS (SELECT 1 FROM public.clinic_settings);

-- 2. REPORT TEMPLATES (Fix 'Erro ao salvar' and ensure columns)
CREATE TABLE IF NOT EXISTS public.report_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    type TEXT,
    category TEXT DEFAULT 'Laudos',
    content TEXT, -- Using TEXT to store HTML strings safely
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT false
);

-- Ensure columns exist (Idempotent for updates)
DO $$
BEGIN
    ALTER TABLE public.report_templates ADD COLUMN IF NOT EXISTS content TEXT;
    ALTER TABLE public.report_templates ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Laudos';
    ALTER TABLE public.report_templates ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}';
    ALTER TABLE public.report_templates ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id);
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'Column already exists';
END $$;

-- 3. PERMISSIONS & RLS (Fix 'Eu' dropdown and Save Errors)
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Clinic Settings Policies
DROP POLICY IF EXISTS "Authenticated users can view settings" ON public.clinic_settings;
DROP POLICY IF EXISTS "Authenticated users can update settings" ON public.clinic_settings;
DROP POLICY IF EXISTS "Authenticated users can insert settings" ON public.clinic_settings;

CREATE POLICY "Authenticated users can view settings" ON public.clinic_settings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update settings" ON public.clinic_settings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert settings" ON public.clinic_settings FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Report Templates Policies (Robust)
-- Drop Legacy Names
DROP POLICY IF EXISTS "Templates are insertable by authenticated users" ON public.report_templates;
DROP POLICY IF EXISTS "Templates are updatable by creators or admins" ON public.report_templates;
DROP POLICY IF EXISTS "Templates are deletable by creators or admins" ON public.report_templates;
DROP POLICY IF EXISTS "Templates are viewable by everyone" ON public.report_templates;

-- Drop New Names (Current Script Targets)
DROP POLICY IF EXISTS "Templates are viewable by authenticated" ON public.report_templates;
DROP POLICY IF EXISTS "Templates are insertable by authenticated" ON public.report_templates;
DROP POLICY IF EXISTS "Templates are updatable by owners or admins" ON public.report_templates;
DROP POLICY IF EXISTS "Templates are deletable by owners or admins" ON public.report_templates;

CREATE POLICY "Templates are viewable by authenticated" ON public.report_templates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Templates are insertable by authenticated" ON public.report_templates FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Templates are updatable by owners or admins" ON public.report_templates FOR UPDATE USING (
    auth.uid() = profile_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role IN ('master', 'manager', 'admin') OR role IS NOT NULL))
);
CREATE POLICY "Templates are deletable by owners or admins" ON public.report_templates FOR DELETE USING (
    auth.uid() = profile_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role IN ('master', 'manager', 'admin') OR role IS NOT NULL))
);

-- Profiles Visibility (Fix Infinite Recursion)
DROP POLICY IF EXISTS "Profiles viewable by self or master" ON public.profiles;

-- Helper function to bypass RLS when checking permissions
CREATE OR REPLACE FUNCTION public.get_my_role_name()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT r.name FROM public.profiles p JOIN public.roles r ON p.role_id = r.id WHERE p.id = auth.uid()),
    (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()),
    ''
  );
$$;

CREATE POLICY "Profiles viewable by self or master" ON public.profiles FOR SELECT USING (
    auth.uid() = id OR
    (SELECT lower(get_my_role_name())) IN ('master', 'manager', 'admin', 'sócio', 'socio')
);

-- Update Report Templates Policy to also use this safe function
DROP POLICY IF EXISTS "Templates are updatable by owners or admins" ON public.report_templates;
CREATE POLICY "Templates are updatable by owners or admins" ON public.report_templates FOR UPDATE USING (
    auth.uid() = profile_id OR 
    (SELECT lower(get_my_role_name())) IN ('master', 'manager', 'admin', 'sócio', 'socio')
);

DROP POLICY IF EXISTS "Templates are deletable by owners or admins" ON public.report_templates;
CREATE POLICY "Templates are deletable by owners or admins" ON public.report_templates FOR DELETE USING (
    auth.uid() = profile_id OR 
    (SELECT lower(get_my_role_name())) IN ('master', 'manager', 'admin', 'sócio', 'socio')
);

-- 4. Grant Access
GRANT ALL ON public.clinic_settings TO authenticated;
GRANT ALL ON public.report_templates TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

