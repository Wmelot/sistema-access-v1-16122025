-- Create Audit Logs table
create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    created_at timestamp with time zone default now(),
    user_id uuid references auth.users(id),
    action text not null,
    details jsonb default '{}'::jsonb,
    resource text,
    resource_id text,
    ip_address text,
    user_agent text
);

-- Enable RLS
alter table public.audit_logs enable row level security;

-- Policies
create policy "Authenticated users can insert logs"
    on public.audit_logs for insert
    with check (auth.role() = 'authenticated');

create policy "Admins can view logs"
    on public.audit_logs for select
    using (auth.role() = 'service_role' or exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
        and profiles.role = 'admin'
    ));

-- Grant permissions
grant insert on public.audit_logs to authenticated;
grant select on public.audit_logs to service_role;
