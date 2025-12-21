-- Create message templates table for WhatsApp/Email automation

-- Ensure the helper function exists (Standard pattern)
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create table if not exists public.message_templates (
    id uuid not null default gen_random_uuid() primary key,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    
    title text not null, -- e.g., "Lembrete Padrão", "Feliz Aniversário"
    content text not null, -- e.g., "Olá {{name}}, seu agendamento é dia {{date}}..."
    
    channel text not null default 'whatsapp' check (channel in ('whatsapp', 'email', 'sms')),
    trigger_type text not null check (trigger_type in (
        'manual', 
        'appointment_confirmation', 
        'appointment_reminder',
        'birthday',
        'post_attendance',
        'insole_maintenance'
    )),
    
    is_active boolean not null default true,
    
    created_by uuid references auth.users(id) on delete set null
);

-- RLS
alter table public.message_templates enable row level security;

-- Policy: Authenticated users can view
create policy "Authenticated users can view templates" 
    on public.message_templates for select 
    using (auth.role() = 'authenticated');

-- Policy: Masters/Admins can manage (Insert/Update/Delete)
create policy "Masters/Admins can manage templates" 
    on public.message_templates for all 
    using (
        exists (
            select 1 from public.profiles 
            where profiles.id = auth.uid() 
            and profiles.role in ('master', 'manager', 'admin')
        )
    );

-- Trigger to update updated_at
drop trigger if exists update_message_templates_modtime on public.message_templates;
create trigger update_message_templates_modtime
    before update on public.message_templates
    for each row execute procedure public.handle_updated_at();
