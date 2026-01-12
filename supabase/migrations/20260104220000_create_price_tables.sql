-- Create Price Tables and Items
-- This migration restores the missing price_tables functionality

-- 1. Price Tables
CREATE TABLE IF NOT EXISTS public.price_tables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT true
);

-- 2. Price Table Items (Overrides)
CREATE TABLE IF NOT EXISTS public.price_table_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    price_table_id UUID REFERENCES public.price_tables(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(price_table_id, service_id)
);

-- 3. Add Price Table to Patients
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS price_table_id UUID REFERENCES public.price_tables(id) ON DELETE SET NULL;

-- 4. Enable RLS
ALTER TABLE public.price_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_table_items ENABLE ROW LEVEL SECURITY;

-- 5. Policies
DROP POLICY IF EXISTS "Auth users full access price_tables" ON public.price_tables;
CREATE POLICY "Auth users full access price_tables" ON public.price_tables FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth users full access price_table_items" ON public.price_table_items;
CREATE POLICY "Auth users full access price_table_items" ON public.price_table_items FOR ALL USING (auth.role() = 'authenticated');

-- 6. Seed Default Table (Optional but good practice)
INSERT INTO public.price_tables (name, active) VALUES ('Particular (Padrão)', true) ON CONFLICT DO NOTHING;

-- Reload Schema
NOTIFY pgrst, 'reload config';
