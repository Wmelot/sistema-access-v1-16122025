create table if not exists biomechanics_assessments (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references patients(id) on delete cascade not null,
  professional_id uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  data jsonb default '{}'::jsonb not null,
  status text default 'draft' check (status in ('draft', 'completed', 'archived'))
);

-- RLS
alter table biomechanics_assessments enable row level security;

create policy "Users can view their own assessments"
  on biomechanics_assessments for select
  using (auth.uid() = professional_id);

create policy "Users can insert their own assessments"
  on biomechanics_assessments for insert
  with check (auth.uid() = professional_id);

create policy "Users can update their own assessments"
  on biomechanics_assessments for update
  using (auth.uid() = professional_id);
