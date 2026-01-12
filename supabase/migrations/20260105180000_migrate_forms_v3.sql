-- Migration to upgrade existing forms to V3 Schema (Logic & Layout)
-- 1. Adds 'schema_version' column
-- 2. Defines recursive function to patch 'width' and ensure structure
-- 3. Updates all existing templates

ALTER TABLE public.form_templates 
ADD COLUMN IF NOT EXISTS schema_version INTEGER DEFAULT 1;

-- Recursive function to upgrade a single node and its children
CREATE OR REPLACE FUNCTION public.upgrade_form_node(node jsonb) 
RETURNS jsonb 
LANGUAGE plpgsql 
AS $$
DECLARE
    updated_node jsonb;
    child jsonb;
    new_children jsonb := '[]'::jsonb;
BEGIN
    updated_node := node;

    -- 1. Ensure 'width' exists (Default to 'full')
    IF (updated_node->>'width') IS NULL THEN
        updated_node := updated_node || '{"width": "full"}'::jsonb;
    END IF;

    -- 2. Ensure 'id' exists (Critical for Logic Engine)
    -- If id is missing, we can't easily gen_random_uuid() inside jsonb build nicely without casting, 
    -- but usually id exists. If not, we generate one.
    IF (updated_node->>'id') IS NULL THEN
         updated_node := updated_node || jsonb_build_object('id', gen_random_uuid());
    END IF;

    -- 3. Recurse into children
    IF (updated_node->'children') IS NOT NULL AND jsonb_typeof(updated_node->'children') = 'array' THEN
        FOR child IN SELECT * FROM jsonb_array_elements(updated_node->'children')
        LOOP
            new_children := new_children || public.upgrade_form_node(child);
        END LOOP;
        updated_node := updated_node || jsonb_build_object('children', new_children);
    END IF;

    RETURN updated_node;
END;
$$;

-- Apply update to all templates
UPDATE public.form_templates
SET fields = COALESCE((
    SELECT jsonb_agg(public.upgrade_form_node(elem))
    FROM jsonb_array_elements(fields) AS elem
), '[]'::jsonb),
updated_at = now(),
schema_version = 3;

-- Clean up function (optional, but useful to keep for future)
-- DROP FUNCTION public.upgrade_form_node(jsonb);
