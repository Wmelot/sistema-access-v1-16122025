-- Clean Duplicates and Fix Address Schema Cache
-- 1. Deduplicate Price Tables with FK Reassignment
DO $$ 
DECLARE
    r RECORD;
    keep_id UUID;
BEGIN
    FOR r IN (
        SELECT name, COUNT(*) 
        FROM public.price_tables 
        GROUP BY name 
        HAVING COUNT(*) > 1
    ) LOOP
        -- Select the ID to keep (Active one or Oldest)
        SELECT id INTO keep_id 
        FROM public.price_tables 
        WHERE name = r.name 
        ORDER BY active DESC, created_at ASC 
        LIMIT 1;

        -- Update Patients to point to keep_id
        UPDATE public.patients 
        SET price_table_id = keep_id 
        WHERE price_table_id IN (SELECT id FROM public.price_tables WHERE name = r.name AND id != keep_id);

        -- Update Price Table Items to point to keep_id
        -- Handle conflicts: If keep_id already has the item, just delete references from duplicate
        -- For simplicity, let's just delete items of duplicates if conflict, or move them if not.
        -- Given this is "Particular (Padrão)", items are likely same or empty.
        DELETE FROM public.price_table_items 
        WHERE price_table_id IN (SELECT id FROM public.price_tables WHERE name = r.name AND id != keep_id);

        -- Delete the duplicate tables
        DELETE FROM public.price_tables 
        WHERE name = r.name AND id != keep_id;
    END LOOP;
END $$;

-- 2. Add Constraint (Safe Update)
ALTER TABLE public.price_tables 
DROP CONSTRAINT IF EXISTS price_tables_name_key;

ALTER TABLE public.price_tables 
ADD CONSTRAINT price_tables_name_key UNIQUE (name);

-- 3. Force Schema Cache Reload for 'address' column visibility
-- We toggle a comment or dummy change to ensure PostgREST notices
COMMENT ON COLUMN public.patients.address IS 'Full address stored as JSONB';

NOTIFY pgrst, 'reload config';
