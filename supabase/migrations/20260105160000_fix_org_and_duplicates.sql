-- Fix User Organization and Merge Price Tables

-- 1. FIX USER ORGANIZATION (The Critical Error)
-- Ensure at least one organization exists
INSERT INTO public.organizations (name) 
VALUES ('Minha Clínica') 
ON CONFLICT DO NOTHING;

-- Link ALL orphan profiles to the first available organization
DO $$
DECLARE
    org_id UUID;
BEGIN
    SELECT id INTO org_id FROM public.organizations LIMIT 1;
    
    IF org_id IS NOT NULL THEN
        UPDATE public.profiles 
        SET organization_id = org_id 
        WHERE organization_id IS NULL;
    END IF;
END $$;

-- 2. MERGE "Padrão" INTO "Particular (Padrão)" (The Duplicate Issue)
DO $$
DECLARE
    target_id UUID;
    old_id UUID;
BEGIN
    -- Find the target (official) table
    SELECT id INTO target_id FROM public.price_tables WHERE name = 'Particular (Padrão)' LIMIT 1;
    
    -- If target doesn't exist, try to rename "Padrão" to it, or create it
    IF target_id IS NULL THEN
        UPDATE public.price_tables SET name = 'Particular (Padrão)' WHERE name = 'Padrão' RETURNING id INTO target_id;
    END IF;

    -- If still null (meaning neither existed, which is unlikely given screenshots), create it
    IF target_id IS NULL THEN
        INSERT INTO public.price_tables (name, active) VALUES ('Particular (Padrão)', true) RETURNING id INTO target_id;
    END IF;

    -- Find the bad table "Padrão" (if we didn't just rename it)
    SELECT id INTO old_id FROM public.price_tables WHERE name = 'Padrão' AND id != target_id LIMIT 1;

    -- If we have both, merge
    IF target_id IS NOT NULL AND old_id IS NOT NULL THEN
        -- Move patients
        UPDATE public.patients SET price_table_id = target_id WHERE price_table_id = old_id;
        -- Move items
        UPDATE public.price_table_items SET price_table_id = target_id WHERE price_table_id = old_id;
        -- Delete old
        DELETE FROM public.price_tables WHERE id = old_id;
    END IF;
END $$;

-- Reload Schema
NOTIFY pgrst, 'reload config';
