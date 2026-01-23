-- Add Master role to the system
-- This role is for the super administrator who can manage all organizations

INSERT INTO public.roles (name, description, is_system) VALUES
    ('Master', 'Super administrador do sistema Axiom', true)
ON CONFLICT (name) DO NOTHING;

-- Assign all permissions to Master role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'Master'
ON CONFLICT DO NOTHING;
