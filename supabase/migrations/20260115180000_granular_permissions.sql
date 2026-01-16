-- Add Granular Permissions for Advanced Access Control
-- Matches Legacy System "Matrix" requirements

INSERT INTO public.permissions (code, description, module) VALUES
    -- Agenda / Scheduling
    ('appointments.view_all', 'Visualizar agenda de TODOS', 'Agenda'),
    ('appointments.view_own', 'Visualizar PRÓPRIA agenda', 'Agenda'),
    ('appointments.manage_all', 'Gerenciar agenda de TODOS', 'Agenda'),
    ('appointments.manage_own', 'Gerenciar PRÓPRIA agenda', 'Agenda'),

    -- Financial
    ('financial.view_clinic', 'Visualizar financeiro da CLÍNICA (Faturamento)', 'Financeiro'),
    ('financial.view_own', 'Visualizar SUAS comissões/ganhos', 'Financeiro'),
    
    -- Patients
    ('patients.view_all', 'Visualizar TODOS os pacientes', 'Pacientes'),
    ('patients.view_assigned', 'Visualizar APENAS seus pacientes', 'Pacientes'),

    -- Medical Records / Prontuários
    ('records.view_all', 'Ler prontuários de TODOS', 'Prontuários'),
    ('records.view_assigned', 'Ler prontuários de SEUS pacientes', 'Prontuários'),
    ('records.edit_all', 'Editar prontiários de TODOS', 'Prontuários'),
    ('records.edit_own', 'Editar SEUS prontuários', 'Prontuários')

ON CONFLICT (code) DO UPDATE 
SET description = EXCLUDED.description, module = EXCLUDED.module;

-- Update Roles to include defaults (Safe defaults)

-- Profissional: Vê própria agenda, próprios pacientes, suas comissões
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'Profissional' 
  AND p.code IN (
      'appointments.view_own', 'appointments.manage_own',
      'patients.view_assigned',
      'financial.view_own',
      'records.view_assigned', 'records.edit_own'
  )
ON CONFLICT DO NOTHING;

-- Recepcionista: Vê agenda de todos, vê todos pacientes (para agendar)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'Recepcionista' 
  AND p.code IN (
      'appointments.view_all', 'appointments.manage_all',
      'patients.view_all'
  )
ON CONFLICT DO NOTHING;

-- Administrador: Vê tudo (já tem acesso total, mas garantindo na matriz)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'Administrador' 
  AND p.code IN (
      'appointments.view_all', 'appointments.manage_all',
      'financial.view_clinic', 'financial.view_own',
      'patients.view_all',
      'records.view_all', 'records.edit_all'
  )
ON CONFLICT DO NOTHING;
