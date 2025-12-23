-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Linked to Auth)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  role text default 'physio' check (role in ('admin', 'physio', 'receptionist')),
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  organization_id uuid -- Added for multi-tenancy support
);

-- 2. PATIENTS
create table public.patients (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  cpf text unique,
  birthdate date,
  email text,
  phone text,
  address_zip text,
  address_street text,
  notes text,
  organization_id uuid -- Added for multi-tenancy support
);

-- 3. CLINICAL RECORDS (Prontuário)
create table public.clinical_records (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  patient_id uuid references public.patients(id) on delete cascade not null,
  professional_id uuid references public.profiles(id),
  title text not null, -- e.g. "Evolução", "Avaliação"
  content text, -- Text content or JSON
  attachments jsonb[] -- Array of file metadata {name, url, type}
);

-- 4. SCHEDULE (Agenda)
create table public.appointments (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  patient_id uuid references public.patients(id),
  professional_id uuid references public.profiles(id),
  title text,
  type text default 'appointment' check (type in ('appointment', 'block')),
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  status text default 'scheduled' check (status in ('scheduled', 'confirmed', 'completed', 'canceled')),
  notes text
);

-- 5. FINANCIALS
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  price numeric(10,2) not null default 0,
  stock_quantity integer default 0,
  active boolean default true
);

create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  type text check (type in ('income', 'expense')),
  amount numeric(10,2) not null,
  description text,
  category text, -- e.g. "Consultas", "Aluguel", "Material"
  patient_id uuid references public.patients(id), -- Optional link to patient
  date date default current_date
);

-- RLS POLICIES (Simple version: Authenticated users can do everything for now)
-- In production, you would restrict 'delete' to admins, etc.

alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.clinical_records enable row level security;
alter table public.appointments enable row level security;
alter table public.products enable row level security;
alter table public.transactions enable row level security;

create policy "Authenticated users can view profiles" on public.profiles for select using (auth.role() = 'authenticated');
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Auth users can view all patients" on public.patients for select using (auth.role() = 'authenticated');
create policy "Auth users can insert patients" on public.patients for insert with check (auth.role() = 'authenticated');
create policy "Auth users can update patients" on public.patients for update using (auth.role() = 'authenticated');

create policy "Auth users can view records" on public.clinical_records for select using (auth.role() = 'authenticated');
create policy "Auth users can insert records" on public.clinical_records for insert with check (auth.role() = 'authenticated');

create policy "Auth users can manage appointments" on public.appointments for all using (auth.role() = 'authenticated');
create policy "Auth users can manage products" on public.products for all using (auth.role() = 'authenticated');
create policy "Auth users can manage transactions" on public.transactions for all using (auth.role() = 'authenticated');

-- STORAGE BUCKETS
-- Note: Buckets are usually created via UI, but policies nicely here.
-- Assuming a bucket named 'patient-files' exists.

-- 6. MIGRATION: 2024-05-20
-- Add price column to appointments
alter table public.appointments 
add column if not exists price numeric(10,2);

-- 7. MIGRATION: LGPD Logs
create table public.system_logs (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id),
  action text not null,
  details jsonb
);

alter table public.system_logs enable row level security;
create policy "Authenticated users can view logs" on public.system_logs for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert logs" on public.system_logs for insert with check (auth.role() = 'authenticated');

-- 8. MIGRATION: Services Table
create table if not exists public.services (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  duration integer not null default 60,
  active boolean default true
);

alter table public.services enable row level security;
create policy "Authenticated users can view services" on public.services for select using (auth.role() = 'authenticated');
create policy "Authenticated users can manage services" on public.services for all using (auth.role() = 'authenticated');

-- 9. MIGRATION: Products & Sales Enhancements
alter table public.products 
add column if not exists is_unlimited boolean default false;

alter table public.transactions 
add column if not exists product_id uuid references public.products(id),
add column if not exists quantity integer default 1;

-- 10. MIGRATION: Financial Cost (Profit Calculation)
alter table public.transactions 
add column if not exists production_cost numeric(10,2) default 0;

-- 11. MIGRATION: Professionals & Availability
-- Enhancing profiles
alter table public.profiles
add column if not exists cpf text,
add column if not exists birthdate date,
add column if not exists gender text,
add column if not exists phone text,
add column if not exists council_type text,
add column if not exists council_number text,
add column if not exists specialty text,
add column if not exists color text default '#3b82f6',
add column if not exists photo_url text,
add column if not exists bio text,
add column if not exists address_zip text,
add column if not exists address_street text,
add column if not exists address_number text,
add column if not exists address_complement text,
add column if not exists address_neighborhood text,
add column if not exists address_city text,
add column if not exists address_state text;

-- Service Linking
create table if not exists public.service_professionals (
    service_id uuid references public.services(id) on delete cascade,
    profile_id uuid references public.profiles(id) on delete cascade,
    primary key (service_id, profile_id)
);
alter table public.service_professionals enable row level security;
create policy "All auth can view service_prof" on public.service_professionals for select using (auth.role() = 'authenticated');
create policy "All auth can manage service_prof" on public.service_professionals for all using (auth.role() = 'authenticated');

-- Availability
create table if not exists public.professional_availability (
    id uuid default uuid_generate_v4() primary key,
    profile_id uuid references public.profiles(id) on delete cascade,
    day_of_week integer not null,
    start_time time not null,
    end_time time not null,
    is_break boolean default false
);
alter table public.professional_availability enable row level security;
create policy "All auth can view availability" on public.professional_availability for select using (auth.role() = 'authenticated');
create policy "Manage own availability" on public.professional_availability for all using (auth.uid() = profile_id);

-- 12. MIGRATION: Profiles Email
alter table public.profiles
add column if not exists email text;

-- 6. LOCATIONS (Locais de Atendimento)
create table if not exists public.locations (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null, -- "Consultório 1", "Ginásio"
  capacity integer default 1 not null, -- 1 for rooms, 4 for gym
  color text -- Optional: color code for UI
);

-- Add location support to appointments
alter table public.appointments 
add column if not exists location_id uuid references public.locations(id);

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

-- 7. Advanced Availability Changes
-- Add location to availability slots
alter table public.professional_availability
add column if not exists location_id uuid references public.locations(id);

-- Add settings to professional profiles
alter table public.profiles
add column if not exists slot_interval integer default 30, -- 15, 30, 45, 60
add column if not exists allow_overbooking boolean default false; -- "Encaixes"
