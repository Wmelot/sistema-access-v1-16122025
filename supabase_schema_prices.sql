-- Tabela de Tabelas de Preços (ex: Particular, Unimed, Social)
create table if not exists price_tables (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Itens da Tabela de Preços (Preço específico para cada serviço na tabela)
create table if not exists price_table_items (
  id uuid default gen_random_uuid() primary key,
  price_table_id uuid references price_tables(id) on delete cascade not null,
  service_id uuid references services(id) on delete cascade not null,
  price decimal(10, 2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(price_table_id, service_id) -- Garante apenas um preço por serviço na tabela
);

-- Adicionar referência na tabela de pacientes
alter table patients add column if not exists price_table_id uuid references price_tables(id) on delete set null;

-- RLS
alter table price_tables enable row level security;
alter table price_table_items enable row level security;

-- Políticas (Simplificadas para uso autenticado)
create policy "Users can view price tables" on price_tables for select to authenticated using (true);
create policy "Users can insert price tables" on price_tables for insert to authenticated with check (true);
create policy "Users can update price tables" on price_tables for update to authenticated using (true);
create policy "Users can delete price tables" on price_tables for delete to authenticated using (true);

create policy "Users can view price items" on price_table_items for select to authenticated using (true);
create policy "Users can insert price items" on price_table_items for insert to authenticated with check (true);
create policy "Users can update price items" on price_table_items for update to authenticated using (true);
create policy "Users can delete price items" on price_table_items for delete to authenticated using (true);

-- Notificar mudança de schema
NOTIFY pgrst, 'reload config';
