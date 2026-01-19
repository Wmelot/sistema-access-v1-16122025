-- Migration: Add new columns to existing permissions table
-- This maintains backward compatibility while adding granular permissions

-- Add new columns to permissions table
ALTER TABLE permissions 
ADD COLUMN IF NOT EXISTS action VARCHAR(50),
ADD COLUMN IF NOT EXISTS granted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id) ON DELETE CASCADE;

-- Create index for new structure
CREATE INDEX IF NOT EXISTS idx_permissions_role_action ON permissions(role_id, module, action) WHERE role_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN permissions.action IS 'Granular action (view, create, update, delete, menu_visible, etc.)';
COMMENT ON COLUMN permissions.granted IS 'Whether this permission is granted (used with role_id)';
COMMENT ON COLUMN permissions.role_id IS 'Direct role assignment (new system), NULL for old permission codes';

-- Note: The old system uses:
--   - permissions.code (e.g., 'appointments.edit')
--   - role_permissions table for assignment
-- 
-- The new system uses:
--   - permissions.module + permissions.action + permissions.role_id
--   - permissions.granted boolean
--
-- Both can coexist. Old code checks role_permissions, new code checks permissions directly.
