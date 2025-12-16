-- 7. SERVICES (Procedimentos/Serviços)
create table public.services (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null, -- "Fisioterapia Traumato", "Pilates"
  duration integer default 60 not null, -- in minutes
  price numeric(10,2) default 0.00,
  active boolean default true
);

-- Add service support to appointments (replacing free text if necessary, or keeping both)
alter table public.appointments 
add column service_id uuid references public.services(id);

-- Permissions
alter table public.services enable row level security;
create policy "Auth users can view services" on public.services for select using (auth.role() = 'authenticated');
create policy "Auth users can manage services" on public.services for all using (auth.role() = 'authenticated');

-- Seed Data
insert into public.services (name, duration, price) values 
('Fisioterapia Traumato-Ortopédica', 50, 150.00),
('Pilates (Sessão)', 50, 120.00),
('Avaliação Fisioterapêutica', 60, 200.00),
('Osteopatia', 50, 250.00);
