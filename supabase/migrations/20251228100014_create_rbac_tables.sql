-- Create RBAC (Role-Based Access Control) tables

-- 1. Permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    code TEXT UNIQUE NOT NULL, -- e.g. 'patients.view', 'roles.manage'
    description TEXT,
    module TEXT NOT NULL -- e.g. 'Pacientes', 'Configurações', 'Financeiro'
);

-- 2. Roles table
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false -- System roles cannot be deleted
);

-- 3. Role-Permission junction table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE NOT NULL,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(role_id, permission_id)
);

-- 4. User-Role assignment (if not already in profiles)
-- Add role_id to profiles if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id);

-- Enable RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Permissions
CREATE POLICY "Authenticated users can view permissions"
    ON public.permissions FOR SELECT
    USING (auth.role() = 'authenticated');

-- RLS Policies for Roles
CREATE POLICY "Authenticated users can view roles"
    ON public.roles FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage roles"
    ON public.roles FOR ALL
    USING (auth.role() = 'authenticated');

-- RLS Policies for Role Permissions
CREATE POLICY "Authenticated users can view role permissions"
    ON public.role_permissions FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage role permissions"
    ON public.role_permissions FOR ALL
    USING (auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id 
    ON public.role_permissions(role_id);

CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id 
    ON public.role_permissions(permission_id);

CREATE INDEX IF NOT EXISTS idx_profiles_role_id 
    ON public.profiles(role_id);

-- Seed default permissions
INSERT INTO public.permissions (code, description, module) VALUES
    ('patients.view', 'Visualizar pacientes', 'Pacientes'),
    ('patients.create', 'Criar pacientes', 'Pacientes'),
    ('patients.edit', 'Editar pacientes', 'Pacientes'),
    ('patients.delete', 'Excluir pacientes', 'Pacientes'),
    ('appointments.view', 'Visualizar agendamentos', 'Agenda'),
    ('appointments.create', 'Criar agendamentos', 'Agenda'),
    ('appointments.edit', 'Editar agendamentos', 'Agenda'),
    ('appointments.delete', 'Excluir agendamentos', 'Agenda'),
    ('financial.view', 'Visualizar financeiro', 'Financeiro'),
    ('financial.manage', 'Gerenciar financeiro', 'Financeiro'),
    ('reports.view', 'Visualizar relatórios', 'Relatórios'),
    ('reports.generate', 'Gerar relatórios', 'Relatórios'),
    ('settings.view', 'Visualizar configurações', 'Configurações'),
    ('settings.manage', 'Gerenciar configurações', 'Configurações'),
    ('roles.view', 'Visualizar perfis', 'Configurações'),
    ('roles.manage', 'Gerenciar perfis', 'Configurações'),
    ('users.view', 'Visualizar usuários', 'Configurações'),
    ('users.manage', 'Gerenciar usuários', 'Configurações')
ON CONFLICT (code) DO NOTHING;

-- Seed default roles
INSERT INTO public.roles (name, description, is_system) VALUES
    ('Administrador', 'Acesso total ao sistema', true),
    ('Profissional', 'Acesso completo a pacientes e agenda', true),
    ('Recepcionista', 'Acesso a agendamentos e pacientes (sem financeiro)', true),
    ('Visualizador', 'Apenas visualização (sem edição)', true)
ON CONFLICT (name) DO NOTHING;

-- Assign all permissions to Administrator role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'Administrador'
ON CONFLICT DO NOTHING;

-- Assign permissions to Profissional role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'Profissional'
    AND p.code IN (
        'patients.view', 'patients.create', 'patients.edit',
        'appointments.view', 'appointments.create', 'appointments.edit',
        'reports.view', 'reports.generate',
        'settings.view'
    )
ON CONFLICT DO NOTHING;

-- Assign permissions to Recepcionista role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'Recepcionista'
    AND p.code IN (
        'patients.view', 'patients.create', 'patients.edit',
        'appointments.view', 'appointments.create', 'appointments.edit'
    )
ON CONFLICT DO NOTHING;

-- Assign permissions to Visualizador role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'Visualizador'
    AND p.code LIKE '%.view'
ON CONFLICT DO NOTHING;

-- Reload Schema
NOTIFY pgrst, 'reload config';
