-- Create permissions table for granular access control
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    module VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    granted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, module, action)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_permissions_role_module ON permissions(role_id, module);
CREATE INDEX IF NOT EXISTS idx_permissions_granted ON permissions(granted) WHERE granted = true;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER permissions_updated_at
    BEFORE UPDATE ON permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_permissions_updated_at();

-- Add comment
COMMENT ON TABLE permissions IS 'Granular permissions matrix for role-based access control';
COMMENT ON COLUMN permissions.module IS 'Module identifier (e.g., schedule, patients, financial)';
COMMENT ON COLUMN permissions.action IS 'Action type (e.g., view, create, update, delete, menu_visible)';
COMMENT ON COLUMN permissions.granted IS 'Whether this permission is granted to the role';
