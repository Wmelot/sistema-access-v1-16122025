-- SCRIPT DE DEPENDÊNCIAS (SERVIÇOS + PREÇOS)

-- 1. Criar tabela de Serviços  (Caso não exista ainda)
create table if not exists services (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  duration integer not null, -- em minutos
  price decimal(10, 2) not null, -- preço padrão
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS para Serviços
alter table services enable row level security;
create policy "Users can view services" on services for select to authenticated using (true);
create policy "Users can insert services" on services for insert to authenticated with check (true);
create policy "Users can update services" on services for update to authenticated using (true);

-- 2. Criar Tabelas de Preços (Agora vai funcionar pois 'services' existe)
create table if not exists price_tables (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists price_table_items (
  id uuid default gen_random_uuid() primary key,
  price_table_id uuid references price_tables(id) on delete cascade not null,
  service_id uuid references services(id) on delete cascade not null,
  price decimal(10, 2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(price_table_id, service_id)
);

-- 3. Adicionar vínculos no Paciente
alter table patients add column if not exists price_table_id uuid references price_tables(id) on delete set null;

-- Notificar
NOTIFY pgrst, 'reload config';
