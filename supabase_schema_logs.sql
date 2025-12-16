
-- Tabela de Logs do Sistema (LGPD)
create table if not exists system_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  action text not null, -- ex: 'CREATE_PATIENT', 'UPDATE_APPOINTMENT'
  details jsonb, -- detalhes do que mudou
  ip_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table system_logs enable row level security;

-- Apenas admins podem ver logs, ou o próprio usuário (depende da regra, aqui deixarei aberto para leitura autenticada por enquanto)
create policy "Users can view logs"
  on system_logs for select
  to authenticated
  using (true);

-- Apenas o sistema (via server action) deveria inserir, mas deixamos insert aberto para authenticated por hora
create policy "Users can insert logs"
  on system_logs for insert
  to authenticated
  with check (true);
