-- Restore Clinic Settings Table

CREATE TABLE IF NOT EXISTS public.clinic_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Minha Clínica',
    cnpj TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    primary_color TEXT DEFAULT '#84c8b9',
    logo_url TEXT,
    document_logo_url TEXT,
    address JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users full access clinic_settings" ON public.clinic_settings
    FOR ALL
    USING (auth.role() = 'authenticated');

-- Insert default row if empty
INSERT INTO public.clinic_settings (name, primary_color)
SELECT 'Access Fisioterapia', '#84c8b9'
WHERE NOT EXISTS (SELECT 1 FROM public.clinic_settings);

-- Reload Schema
NOTIFY pgrst, 'reload config';
