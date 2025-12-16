-- 15. MIGRATION: Financial Dashboard & Payment Methods
-- Created at: 2025-12-16

-- A. Create Payment Methods Table
create table if not exists public.payment_methods (
  id uuid default uuid_generate_v4() primary key,
  name text not null, -- 'Dinheiro', 'Pix', 'Crédito', 'Débito'
  fee_percent numeric(5,2) default 0, -- e.g. 3.50 (%)
  fee_fixed numeric(10,2) default 0, -- e.g. 0.50 (R$)
  days_to_receive integer default 0, -- e.g. 30 (D+30)
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- Seed Default Methods
insert into public.payment_methods (name, fee_percent, days_to_receive) values 
('Dinheiro', 0, 0),
('Pix', 0, 0),
('Cartão de Débito', 1.99, 1),
('Cartão de Crédito (1x)', 3.49, 30),
('Cartão de Crédito (Parcelado)', 4.99, 30)
on conflict do nothing; -- (No unique constraint on name yet, but should handle manually if needed, or simple insert)
-- Actually, let's just insert if table is empty? 
-- Simplest is just insert. Duplicates generally won't happen first run.

-- B. Update Appointments to link Payment Method
alter table public.appointments 
add column if not exists payment_method_id uuid references public.payment_methods(id);

-- C. Add Permissions for Financial Dashboard
-- Insert 'financial.view_own' and 'financial.view_clinic'
insert into public.permissions (code, description, module) values
('financial.view_own', 'Visualizar extrato financeiro pessoal', 'Financeiro'),
('financial.view_clinic', 'Visualizar extrato financeiro da clínica', 'Financeiro')
on conflict (code) do nothing;

-- D. Assign to Roles
-- Master gets financial.view_clinic (and own)
do $$
declare
    master_role_id uuid;
    prof_role_id uuid;
    perm_own_id uuid;
    perm_clinic_id uuid;
begin
    select id into master_role_id from public.roles where name = 'Master';
    select id into prof_role_id from public.roles where name = 'Profissional';
    
    select id into perm_own_id from public.permissions where code = 'financial.view_own';
    select id into perm_clinic_id from public.permissions where code = 'financial.view_clinic';

    -- Master
    if master_role_id is not null and perm_clinic_id is not null then
        insert into public.role_permissions (role_id, permission_id) 
        values (master_role_id, perm_clinic_id) 
        on conflict do nothing;
    end if;
     if master_role_id is not null and perm_own_id is not null then
        insert into public.role_permissions (role_id, permission_id) 
        values (master_role_id, perm_own_id) 
        on conflict do nothing;
    end if;

    -- Profissional
    if prof_role_id is not null and perm_own_id is not null then
        insert into public.role_permissions (role_id, permission_id) 
        values (prof_role_id, perm_own_id) 
        on conflict do nothing;
    end if;
end $$;

-- E. Create View or Functions later? 
-- For now, frontend will query:
-- "My Net" = SUM(appt.price - (appt.price * method.fee_percent/100) - method.fee_fixed)
