-- Add color column to services safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'color') THEN
        ALTER TABLE public.services ADD COLUMN color text DEFAULT '#3b82f6';
    END IF;
END $$;
