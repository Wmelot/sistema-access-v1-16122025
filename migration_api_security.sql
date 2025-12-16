
-- 1. Create API Integrations Table
create table if not exists public.api_integrations (
  id uuid default uuid_generate_v4() primary key,
  service_name text not null unique, -- e.g. 'eNotas', 'Stripe', 'GoogleCalendar'
  is_active boolean default true,
  credentials jsonb default '{}'::jsonb, -- Stores encrypted keys or raw keys depending on strategy. For now we rely on RLS.
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Enable RLS
alter table public.api_integrations enable row level security;

-- 3. Permissions
-- Insert new permission
insert into public.permissions (code, description, module) values
('system.manage_apis', 'Gerenciar Chaves de API e Integrações', 'Sistema')
on conflict (code) do nothing;

-- Assign to Master Role (Assuming Master role id is known or we use subquery)
-- We'll use the standard subquery pattern from previous migrations
-- Assign to Master Role
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.name = 'Master' 
and p.code = 'system.manage_apis'
on conflict do nothing;

-- 4. Policies
-- Only users with 'system.manage_apis' can VIEW or MANAGE
-- We use the new RBAC system via user_roles table.


-- Policy using join to roles
create policy "Masters can manage APIs"
on public.api_integrations
for all
using (
  exists (
    select 1 from public.profiles p
    join public.roles r on r.id = p.role_id
    where p.id = auth.uid()
    and r.name = 'Master'
  )
);
