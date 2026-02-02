-- Create bucket for logos if it doesn't exist (Supabase Storage)
-- Note: This usually needs to be done via UI for storage buckets, but we can define policies here assuming the bucket 'logos' exists or will be created.

create table if not exists clinic_settings (
    id uuid primary key default gen_random_uuid(),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    name text not null default 'Minha Clínica',
    cnpj text,
    email text,
    phone text,
    website text,
    address jsonb default '{}'::jsonb, -- Store street, number, zip, city, state
    logo_url text,
    primary_color text default '#84c8b9', -- Default to the user's preferred color
    
    -- Ensure only one active settings row if we want a single-tenant feel, 
    -- or just allow multiple if different profiles manage different clinics.
    -- For now, we'll assume a singleton pattern or per-user. 
    -- Let's link to auth.users if needed, or just keep it global for the system instance.
    -- Given the context of "Sistema Access", it seems to be single tenant.
    is_active boolean default true
);

-- RLS
alter table clinic_settings enable row level security;

create policy "Authenticated users can view settings"
    on clinic_settings for select
    using (auth.role() = 'authenticated');

create policy "Authenticated users can update settings"
    on clinic_settings for update
    using (auth.role() = 'authenticated');
    
create policy "Authenticated users can insert settings"
    on clinic_settings for insert
    with check (auth.role() = 'authenticated');

-- Initial Seed (optional, ensures at least one row exists to update)
insert into clinic_settings (name)
select 'Access Fisioterapia'
where not exists (select 1 from clinic_settings);
