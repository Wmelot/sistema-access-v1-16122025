-- 13. MIGRATION: Role-Based Access Control (RBAC) System
-- Created at: 2025-12-16

-- A. Create Roles Table
create table if not exists public.roles (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique, -- 'Master', 'Profissional', 'Secretária'
  description text,
  is_system boolean default false, -- If true, cannot be deleted (e.g. Master)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- B. Create Permissions Table
create table if not exists public.permissions (
  id uuid default uuid_generate_v4() primary key,
  code text not null unique, -- 'financial.view', 'schedule.manage_all'
  description text,
  module text -- 'General', 'Financial', 'Schedule'
);

-- C. Join Table: Role <-> Permissions
create table if not exists public.role_permissions (
  role_id uuid references public.roles(id) on delete cascade not null,
  permission_id uuid references public.permissions(id) on delete cascade not null,
  primary key (role_id, permission_id)
);

-- D. Enable RLS
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;

-- Policies (Initially, auth users can read all to bootstrap, strict management later)
create policy "Authenticated users can view roles" on public.roles for select using (auth.role() = 'authenticated');
-- Only Master (managed by app logic eventually) or superuser can insert/update roles. 
-- For now, allowing authenticated users to manage roles to enable the UI development, 
-- in production this should be restricted to users with 'admin.roles' permission.
create policy "Authenticated users can manage roles" on public.roles for all using (auth.role() = 'authenticated');

create policy "Authenticated users can view permissions" on public.permissions for select using (auth.role() = 'authenticated');
create policy "Authenticated users can manage permissions" on public.permissions for all using (auth.role() = 'authenticated');

create policy "Authenticated users can view role_permissions" on public.role_permissions for select using (auth.role() = 'authenticated');
create policy "Authenticated users can manage role_permissions" on public.role_permissions for all using (auth.role() = 'authenticated');


-- E. Seed Default Permissions
insert into public.permissions (code, description, module) values
-- Dashboard / General
('dashboard.view', 'Acessar o painel principal', 'Geral'),
('settings.view', 'Visualizar configurações da clínica', 'Configurações'),
('settings.edit', 'Editar configurações da clínica', 'Configurações'),
('roles.manage', 'Gerenciar perfis de acesso', 'Configurações'),

-- Financial
('financial.view', 'Visualizar dashboard financeiro', 'Financeiro'),
('financial.manage', 'Criar e editar transações', 'Financeiro'),

-- Schedule
('schedule.view_all', 'Visualizar agenda de todos', 'Agenda'),
('schedule.manage_all', 'Editar agendamentos de todos', 'Agenda'),
('schedule.view_own', 'Visualizar própria agenda', 'Agenda'), 
('schedule.manage_own', 'Editar própria agenda', 'Agenda'),

-- Patients
('patients.view', 'Visualizar lista de pacientes', 'Pacientes'),
('patients.edit', 'Cadastrar e editar pacientes', 'Pacientes'),
('patients.delete', 'Excluir pacientes', 'Pacientes'),

-- Records (Prontuários)
('records.view_all', 'Ler todos os prontuários', 'Prontuários'),
('records.edit_all', 'Editar todos os prontuários', 'Prontuários'),
('records.view_own', 'Ler prontuários de seus pacientes', 'Prontuários'),
('records.edit_own', 'Criar/Editar seus prontuários', 'Prontuários')
on conflict (code) do nothing;


-- F. Seed Default Roles
insert into public.roles (name, description, is_system) values 
('Master', 'Acesso total a todas as funcionalidades.', true),
('Profissional', 'Acesso à própria agenda e prontuários.', true),
('Recepção', 'Gestão de agenda global e pacientes, sem acesso financeiro avançado.', true)
on conflict (name) do nothing;


-- G. Assign Permissions to Default Roles

-- 1. Master: Get ALL permissions
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.name = 'Master'
on conflict do nothing;

-- 2. Profissional
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.name = 'Profissional' 
and p.code in (
    'dashboard.view', 
    'schedule.view_own', 'schedule.manage_own', 
    'patients.view', 'patients.edit', 
    'records.view_own', 'records.edit_own'
)
on conflict do nothing;

-- 3. Recepção
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.name = 'Recepção' 
and p.code in (
    'dashboard.view', 
    'schedule.view_all', 'schedule.manage_all', 
    'patients.view', 'patients.edit',
    'financial.view' -- Maybe simple view?
)
on conflict do nothing;


-- H. Update Profiles Table
alter table public.profiles 
add column if not exists role_id uuid references public.roles(id);

-- I. Data Migration: Map existing 'role' text to 'role_id'
do $$
declare
    master_id uuid;
    prof_id uuid;
    recep_id uuid;
begin
    select id into master_id from public.roles where name = 'Master';
    select id into prof_id from public.roles where name = 'Profissional';
    select id into recep_id from public.roles where name = 'Recepção';

    -- Migrate 'admin' -> Master
    update public.profiles 
    set role_id = master_id 
    where role = 'admin' and role_id is null;

    -- Migrate 'physio' -> Profissional
    update public.profiles 
    set role_id = prof_id 
    where role = 'physio' and role_id is null;

    -- Migrate 'receptionist' -> Recepção
    update public.profiles 
    set role_id = recep_id 
    where role = 'receptionist' and role_id is null;

    -- Fallback: If any profile has no role, assign Profissional? Or leave null?
    -- Let's assign Profissional as safe default for now if role was missing
    update public.profiles 
    set role_id = prof_id 
    where role_id is null;
end $$;
