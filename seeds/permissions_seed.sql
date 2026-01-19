-- Seed default permissions for each role
-- This script should be run after creating the permissions table

-- Helper function to insert permission if role exists
CREATE OR REPLACE FUNCTION seed_permission(
    p_role_name VARCHAR,
    p_module VARCHAR,
    p_action VARCHAR,
    p_granted BOOLEAN
) RETURNS VOID AS $$
DECLARE
    v_role_id UUID;
BEGIN
    SELECT id INTO v_role_id FROM roles WHERE name = p_role_name LIMIT 1;
    
    IF v_role_id IS NOT NULL THEN
        INSERT INTO permissions (role_id, module, action, granted)
        VALUES (v_role_id, p_module, p_action, p_granted)
        ON CONFLICT (role_id, module, action) 
        DO UPDATE SET granted = p_granted;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ====================
-- MASTER/ADMIN ROLE
-- ====================
-- Grant ALL permissions to Master/Admin

-- Dashboard
SELECT seed_permission('Master', 'dashboard', 'menu_visible', true);

-- Schedule (Agenda)
SELECT seed_permission('Master', 'schedule', 'view', true);
SELECT seed_permission('Master', 'schedule', 'create', true);
SELECT seed_permission('Master', 'schedule', 'update', true);
SELECT seed_permission('Master', 'schedule', 'delete', true);
SELECT seed_permission('Master', 'schedule', 'block', true);
SELECT seed_permission('Master', 'schedule', 'fit_in', true);
SELECT seed_permission('Master', 'schedule', 'menu_visible', true);

-- Patients (Pacientes)
SELECT seed_permission('Master', 'patients', 'view', true);
SELECT seed_permission('Master', 'patients', 'create', true);
SELECT seed_permission('Master', 'patients', 'update', true);
SELECT seed_permission('Master', 'patients', 'delete', true);
SELECT seed_permission('Master', 'patients', 'records', true);
SELECT seed_permission('Master', 'patients', 'certificates', true);
SELECT seed_permission('Master', 'patients', 'prescriptions', true);
SELECT seed_permission('Master', 'patients', 'files', true);
SELECT seed_permission('Master', 'patients', 'menu_visible', true);

-- Financial (Financeiro)
SELECT seed_permission('Master', 'financial', 'view', true);
SELECT seed_permission('Master', 'financial', 'create', true);
SELECT seed_permission('Master', 'financial', 'update', true);
SELECT seed_permission('Master', 'financial', 'delete', true);
SELECT seed_permission('Master', 'financial', 'cash_flow', true);
SELECT seed_permission('Master', 'financial', 'accounts', true);
SELECT seed_permission('Master', 'financial', 'discounts', true);
SELECT seed_permission('Master', 'financial', 'menu_visible', true);
SELECT seed_permission('Master', 'financial', 'overview_menu', true);
SELECT seed_permission('Master', 'financial', 'dre_menu', true);
SELECT seed_permission('Master', 'financial', 'pricing_menu', true);
SELECT seed_permission('Master', 'financial', 'products_menu', true);
SELECT seed_permission('Master', 'financial', 'services_menu', true);

-- Inventory (Estoque)
SELECT seed_permission('Master', 'inventory', 'view', true);
SELECT seed_permission('Master', 'inventory', 'create', true);
SELECT seed_permission('Master', 'inventory', 'update', true);
SELECT seed_permission('Master', 'inventory', 'delete', true);
SELECT seed_permission('Master', 'inventory', 'movements', true);
SELECT seed_permission('Master', 'inventory', 'kits', true);
SELECT seed_permission('Master', 'inventory', 'menu_visible', true);

-- Other Menus
SELECT seed_permission('Master', 'campaigns', 'menu_visible', true);
SELECT seed_permission('Master', 'my_billing', 'menu_visible', true);
SELECT seed_permission('Master', 'forms', 'menu_visible', true);
SELECT seed_permission('Master', 'reminders', 'menu_visible', true);

-- Settings Submenus
SELECT seed_permission('Master', 'settings', 'professionals_menu', true);
SELECT seed_permission('Master', 'settings', 'forms_menu', true);
SELECT seed_permission('Master', 'settings', 'questionnaires_menu', true);
SELECT seed_permission('Master', 'settings', 'locations_menu', true);
SELECT seed_permission('Master', 'settings', 'whatsapp_menu', true);
SELECT seed_permission('Master', 'settings', 'reports_menu', true);
SELECT seed_permission('Master', 'settings', 'system_menu', true);
SELECT seed_permission('Master', 'settings', 'migration_menu', true);

-- ====================
-- PROFESSIONAL ROLE
-- ====================

-- Dashboard
SELECT seed_permission('Profissional', 'dashboard', 'menu_visible', true);

-- Schedule (Limited)
SELECT seed_permission('Profissional', 'schedule', 'view', true);
SELECT seed_permission('Profissional', 'schedule', 'create', true);
SELECT seed_permission('Profissional', 'schedule', 'update', true);
SELECT seed_permission('Profissional', 'schedule', 'delete', false);
SELECT seed_permission('Profissional', 'schedule', 'block', false);
SELECT seed_permission('Profissional', 'schedule', 'fit_in', true);
SELECT seed_permission('Profissional', 'schedule', 'menu_visible', true);

-- Patients (Full clinical access)
SELECT seed_permission('Profissional', 'patients', 'view', true);
SELECT seed_permission('Profissional', 'patients', 'create', true);
SELECT seed_permission('Profissional', 'patients', 'update', true);
SELECT seed_permission('Profissional', 'patients', 'delete', false);
SELECT seed_permission('Profissional', 'patients', 'records', true);
SELECT seed_permission('Profissional', 'patients', 'certificates', true);
SELECT seed_permission('Profissional', 'patients', 'prescriptions', true);
SELECT seed_permission('Profissional', 'patients', 'files', true);
SELECT seed_permission('Profissional', 'patients', 'menu_visible', true);

-- Financial (Own billing only)
SELECT seed_permission('Profissional', 'financial', 'view', false);
SELECT seed_permission('Profissional', 'financial', 'create', false);
SELECT seed_permission('Profissional', 'financial', 'update', false);
SELECT seed_permission('Profissional', 'financial', 'delete', false);
SELECT seed_permission('Profissional', 'financial', 'menu_visible', false);

-- My Billing (Own commissions)
SELECT seed_permission('Profissional', 'my_billing', 'menu_visible', true);

-- Forms
SELECT seed_permission('Profissional', 'forms', 'menu_visible', true);

-- Reminders
SELECT seed_permission('Profissional', 'reminders', 'menu_visible', true);

-- No access to: Campaigns, Inventory, Settings
SELECT seed_permission('Profissional', 'campaigns', 'menu_visible', false);
SELECT seed_permission('Profissional', 'inventory', 'menu_visible', false);

-- ====================
-- RECEPTIONIST ROLE
-- ====================

-- Dashboard
SELECT seed_permission('Recepcionista', 'dashboard', 'menu_visible', true);

-- Schedule (Full scheduling access)
SELECT seed_permission('Recepcionista', 'schedule', 'view', true);
SELECT seed_permission('Recepcionista', 'schedule', 'create', true);
SELECT seed_permission('Recepcionista', 'schedule', 'update', true);
SELECT seed_permission('Recepcionista', 'schedule', 'delete', true);
SELECT seed_permission('Recepcionista', 'schedule', 'block', true);
SELECT seed_permission('Recepcionista', 'schedule', 'fit_in', true);
SELECT seed_permission('Recepcionista', 'schedule', 'menu_visible', true);

-- Patients (Administrative access, no clinical)
SELECT seed_permission('Recepcionista', 'patients', 'view', true);
SELECT seed_permission('Recepcionista', 'patients', 'create', true);
SELECT seed_permission('Recepcionista', 'patients', 'update', true);
SELECT seed_permission('Recepcionista', 'patients', 'delete', false);
SELECT seed_permission('Recepcionista', 'patients', 'records', false);
SELECT seed_permission('Recepcionista', 'patients', 'certificates', false);
SELECT seed_permission('Recepcionista', 'patients', 'prescriptions', false);
SELECT seed_permission('Recepcionista', 'patients', 'files', true);
SELECT seed_permission('Recepcionista', 'patients', 'menu_visible', true);

-- Financial (Limited)
SELECT seed_permission('Recepcionista', 'financial', 'view', true);
SELECT seed_permission('Recepcionista', 'financial', 'create', true);
SELECT seed_permission('Recepcionista', 'financial', 'update', false);
SELECT seed_permission('Recepcionista', 'financial', 'delete', false);
SELECT seed_permission('Recepcionista', 'financial', 'accounts', true);
SELECT seed_permission('Recepcionista', 'financial', 'menu_visible', true);

-- No access to: My Billing, Forms, Campaigns, Settings
SELECT seed_permission('Recepcionista', 'my_billing', 'menu_visible', false);
SELECT seed_permission('Recepcionista', 'forms', 'menu_visible', false);
SELECT seed_permission('Recepcionista', 'campaigns', 'menu_visible', false);
SELECT seed_permission('Recepcionista', 'reminders', 'menu_visible', false);
SELECT seed_permission('Recepcionista', 'inventory', 'menu_visible', false);

-- Clean up helper function
DROP FUNCTION IF EXISTS seed_permission(VARCHAR, VARCHAR, VARCHAR, BOOLEAN);

-- Verify seed
SELECT 
    r.name as role,
    COUNT(*) as total_permissions,
    SUM(CASE WHEN p.granted THEN 1 ELSE 0 END) as granted_permissions
FROM permissions p
JOIN roles r ON r.id = p.role_id
GROUP BY r.name
ORDER BY r.name;
