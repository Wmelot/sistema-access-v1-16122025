-- Fix: Ensure Master role has financial.view_clinic permission
-- First, check if permission exists
INSERT INTO permissions (code, description)
VALUES ('financial.view_clinic', 'View clinic-wide financial data')
ON CONFLICT (code) DO NOTHING;

-- Get Master role ID
DO $$
DECLARE
    master_role_id UUID;
    permission_id UUID;
BEGIN
    -- Get Master role
    SELECT id INTO master_role_id FROM roles WHERE name = 'Master' LIMIT 1;
    
    -- Get permission
    SELECT id INTO permission_id FROM permissions WHERE code = 'financial.view_clinic' LIMIT 1;
    
    -- Grant permission to Master role
    IF master_role_id IS NOT NULL AND permission_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (master_role_id, permission_id)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Verify Warley's profile
SELECT 
    p.id,
    p.full_name,
    p.role,
    r.name as role_name,
    p.role_id
FROM profiles p
LEFT JOIN roles r ON p.role_id = r.id
WHERE p.full_name ILIKE '%warley%';
