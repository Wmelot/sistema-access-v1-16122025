-- 1. Remove any duplicate organizations with the same slug before applying constraint
DELETE FROM organizations 
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at ASC) as row_num
        FROM organizations
        WHERE slug IS NOT NULL
    ) t WHERE t.row_num > 1
);

-- 2. Add Unique constraint to slug
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_slug_key;
ALTER TABLE organizations ADD CONSTRAINT organizations_slug_key UNIQUE (slug);

-- 3. Ensure Warley has Master role (hardcoded in profiles or roles table)
-- We'll do this via email check in the code anyway, but good to have in DB.
