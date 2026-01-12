-- 1. Create access_logs table
create table if not exists public.access_logs (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_id uuid references auth.users(id),
    resource_type text not null, -- 'patient', 'clinic', 'record'
    resource_id text,
    action text not null, -- 'view_masked', 'view_unmasked'
    ip_address text,
    user_agent text
);

alter table public.access_logs enable row level security;
create policy "Authenticated users can insert logs" on public.access_logs for insert with check (auth.role() = 'authenticated');
create policy "Only system/master can view logs" on public.access_logs for select using (auth.role() = 'service_role'); -- Strict for now

-- 2. Modify patient_active_appointments_view to be SECURITY INVOKER
-- (Assuming the view exists, if not, we recreate it safely or alter it)
-- Note: Views are SECURITY INVOKER by default, so dropping and recreating without 'security definer' is enough, 
-- or simply altering it if supported (PG 15+).
-- Safer to just DROP and RECREATE if we had the definition. 
-- For now, I'll attempt to ALTER.
ALTER VIEW IF EXISTS public.patient_active_appointments_view SET (security_invoker = true);
