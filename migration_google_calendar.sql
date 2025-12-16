-- 1. Table for Professional Integrations (Tokens)
create table if not exists professional_integrations (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid references profiles(id) on delete cascade not null,
    provider text not null check (provider in ('google_calendar')),
    access_token text,
    refresh_token text,
    expiry_date bigint,
    calendar_id text default 'primary',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique(profile_id, provider)
);

-- 2. Add google_event_id to appointments
alter table appointments 
add column if not exists google_event_id text;

-- 3. RLS Policies
alter table professional_integrations enable row level security;

drop policy if exists "Users can view/edit own integrations" on professional_integrations;
create policy "Users can view/edit own integrations"
    on professional_integrations for all
    using (auth.uid() = profile_id);
