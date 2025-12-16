-- 6. LOCATIONS (Locais de Atendimento)
create table public.locations (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null, -- "Consultório 1", "Ginásio"
  capacity integer default 1 not null, -- 1 for rooms, 4 for gym
  color text -- Optional: color code for UI
);

-- Add location support to appointments
alter table public.appointments 
add column location_id uuid references public.locations(id);

-- Insert Permissions
alter table public.locations enable row level security;
create policy "Auth users can view locations" on public.locations for select using (auth.role() = 'authenticated');
create policy "Auth users can manage locations" on public.locations for all using (auth.role() = 'authenticated');

-- Seed Data (Initial Locations)
insert into public.locations (name, capacity, color) values 
('Consultório 1', 1, '#3b82f6'), -- Blue
('Consultório 2', 1, '#10b981'), -- Green
('Consultório 3', 1, '#f59e0b'), -- Orange
('Ginásio', 4, '#8b5cf6');      -- Purple
