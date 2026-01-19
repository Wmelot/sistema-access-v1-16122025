-- Adiciona coluna para link do Google Maps/Meu Negócio se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'google_place_id') THEN
        ALTER TABLE public.organizations ADD COLUMN google_place_id TEXT;
    END IF;
END $$;
