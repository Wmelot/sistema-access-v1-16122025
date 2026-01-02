create table if not exists waiting_list (
  id uuid default gen_random_uuid() primary key,
  service_id uuid references services(id) on delete cascade,
  professional_id uuid references profiles(id) on delete cascade,
  date date not null,
  patient_name text not null,
  patient_phone text not null,
  preference text,
  status text default 'pending',
  created_at timestamptz default now()
);

alter table waiting_list enable row level security;

create policy "Enable read access for authenticated users"
on waiting_list for select
to authenticated
using (true);

create policy "Enable update access for authenticated users"
on waiting_list for update
to authenticated
using (true);

create policy "Enable delete access for authenticated users"
on waiting_list for delete
to authenticated
using (true);

create policy "Enable insert for service role only"
on waiting_list for insert
to service_role
with check (true);
