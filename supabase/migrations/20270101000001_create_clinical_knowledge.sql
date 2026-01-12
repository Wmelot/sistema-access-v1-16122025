-- Create table for Clinical Knowledge Base (Evidence)
create table if not exists clinical_knowledge (
    id uuid primary key default gen_random_uuid(),
    created_at timestamp with time zone default now(),
    keywords text[] not null,
    evidence text not null,
    source text not null,
    category text default 'general'
);

-- Enable RLS
alter table clinical_knowledge enable row level security;

create policy "Authenticated users can view knowledge"
    on clinical_knowledge for select
    using (auth.role() = 'authenticated');

create policy "Admins can manage knowledge"
    on clinical_knowledge for all
    using (auth.role() = 'service_role'); -- or specific admin check
