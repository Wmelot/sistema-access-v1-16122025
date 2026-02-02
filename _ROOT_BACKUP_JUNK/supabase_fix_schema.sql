-- SCRIPT DE CORREÇÃO TOTAL DA TABELA PATIENTS
-- Este script garante que TODAS as colunas necessárias existam.
-- Pode rodar sem medo, ele não apaga dados, apenas cria o que falta.

-- Tabela (caso não exista)
create table if not exists patients (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Dados Pessoais Obrigatórios
alter table patients add column if not exists full_name text;
alter table patients add column if not exists phone text;
alter table patients add column if not exists email text;
alter table patients add column if not exists cpf text; -- Pode ser null para estrangeiros

-- Dados Pessoais Secundários
alter table patients add column if not exists date_of_birth date;
alter table patients add column if not exists gender text;

-- Endereço
alter table patients add column if not exists address text;

-- Dados Complementares
alter table patients add column if not exists occupation text;
alter table patients add column if not exists marketing_source text;
alter table patients add column if not exists relationship_degree text;

-- Relacionamento (Parente)
alter table patients add column if not exists related_patient_id uuid references patients(id) on delete set null;

-- Log de Sistema (caso não tenha criado ainda)
create table if not exists system_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  details jsonb,
  ip_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Recarregar cache do esquema (Para garantir que o Supabase reconheça as mudanças)
NOTIFY pgrst, 'reload config';
