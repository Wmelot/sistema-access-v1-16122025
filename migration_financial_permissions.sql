-- 16. MIGRATION: Granular Financial Permissions & Shared Expenses
-- Created at: 2025-12-16

-- 1. Add new permissions
insert into public.permissions (code, description, module) values
('financial.view_clinic', 'Visualizar painel financeiro completo da clínica', 'Financeiro'),
('financial.view_own', 'Visualizar próprio extrato', 'Financeiro'),
('financial.share_expenses', 'Participar do rateio de despesas (Sócio)', 'Financeiro')
on conflict (code) do nothing;

-- 2. Grant to Master: Gets ALL
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id 
from public.roles r, public.permissions p 
where r.name = 'Master' 
and p.code in ('financial.view_clinic', 'financial.view_own', 'financial.share_expenses')
on conflict do nothing;

-- 3. Grant to Profissional: Gets view_own ONLY
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id 
from public.roles r, public.permissions p 
where r.name = 'Profissional' 
and p.code = 'financial.view_own'
on conflict do nothing;

-- 4. Create 'Socio' Role (Optional but requested context suggests distinct from Master/Pro)
-- If Socio exists, it's Master-like but maybe less admin?
-- For now, let's assume 'Master' covers Socio, OR create a specific role if User wants.
-- User said "profissional sócio".
-- Let's create 'Sócio' role just in case.
insert into public.roles (name, description, is_system) values
('Sócio', 'Sócio da clínica. Acesso financeiro e rateio de despesas.', false)
on conflict (name) do nothing;

-- Grant permissions to Sócio
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.name = 'Sócio'
and p.code in (
    'dashboard.view', 
    'financial.view_clinic', 'financial.view_own', 'financial.share_expenses',
    'schedule.view_all', 'schedule.manage_all',
    'patients.view', 'patients.edit',
    'records.view_all'
)
on conflict do nothing;
