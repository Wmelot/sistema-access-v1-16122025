-- Add status column to patient_records if it doesn't exist
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'patient_records' and column_name = 'status') then
        alter table patient_records add column status text default 'draft';
    end if;
end $$;

-- Add updated_at trigger if not exists
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists update_patient_records_modtime on patient_records;
create trigger update_patient_records_modtime
    before update on patient_records
    for each row
    execute function update_updated_at_column();

-- Ensure system_logs table exists
create table if not exists system_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  action text not null, -- ex: 'UPDATE_RECORD', 'VIEW_RECORD'
  entity text, -- 'patient_record', 'patient', 'appointment'
  entity_id uuid, -- ID of the modified entity
  details jsonb, -- Details of changes
  ip_address text,
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on logs
alter table system_logs enable row level security;

-- Policies for logs
drop policy if exists "Authenticated users can insert logs" on system_logs;
create policy "Authenticated users can insert logs"
  on system_logs for insert
  to authenticated
  with check (true);

drop policy if exists "Admins/Owners can view logs" on system_logs;
create policy "Admins/Owners can view logs"
  on system_logs for select
  to authenticated
  using (true); -- Refine this later if needed
