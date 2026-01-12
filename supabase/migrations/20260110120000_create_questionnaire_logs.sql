create table if not exists public.questionnaire_logs (
    id uuid not null default gen_random_uuid(),
    appointment_id uuid not null references public.appointments(id),
    patient_id uuid not null references public.patients(id),
    questionnaire_type text not null,
    status text not null,
    sent_at timestamp with time zone not null default now(),
    
    constraint questionnaire_logs_pkey primary key (id)
);

-- RLS Policies
alter table public.questionnaire_logs enable row level security;

create policy "Users can view logs"
    on public.questionnaire_logs
    for select
    using (true);

create policy "Users can insert logs"
    on public.questionnaire_logs
    for insert
    with check (true);
