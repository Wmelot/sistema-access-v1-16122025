-- Create a NEW table for granular permissions (separate from old system)
-- This allows both systems to coexist without conflicts

CREATE TABLE IF NOT EXISTS granular_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    module VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    granted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, module, action)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_granular_permissions_role_module ON granular_permissions(role_id, module);
CREATE INDEX IF NOT EXISTS idx_granular_permissions_granted ON granular_permissions(granted) WHERE granted = true;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_granular_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER granular_permissions_updated_at
    BEFORE UPDATE ON granular_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_granular_permissions_updated_at();

-- Add comments
COMMENT ON TABLE granular_permissions IS 'New granular permissions system - separate from legacy permissions table';
COMMENT ON COLUMN granular_permissions.module IS 'Module identifier (e.g., schedule, patients, financial)';
COMMENT ON COLUMN granular_permissions.action IS 'Action type (e.g., view, create, update, delete, menu_visible)';
COMMENT ON COLUMN granular_permissions.granted IS 'Whether this permission is granted to the role';
