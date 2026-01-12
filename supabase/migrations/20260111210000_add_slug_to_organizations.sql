
-- Add slug column to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slug text;

-- Populate existing slugs if null
UPDATE organizations 
SET slug = 'access-fisioterapia' 
WHERE id = '00000000-0000-0000-0000-000000000001' AND slug IS NULL;

-- Fallback for others
UPDATE organizations 
SET slug = 'org-' || substring(id::text, 1, 8) 
WHERE slug IS NULL;

-- Add constraints
CREATE UNIQUE INDEX IF NOT EXISTS organizations_slug_idx ON organizations(slug);
ALTER TABLE organizations ALTER COLUMN slug SET NOT NULL;
