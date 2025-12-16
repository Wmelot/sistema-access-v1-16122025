
-- 16. MIGRATION: Bank Reconciliation
-- Created at: 2025-12-16

-- A. Create Bank Transactions Table
-- Stores imported lines from OFX/CSV
create table if not exists public.bank_transactions (
  id uuid default uuid_generate_v4() primary key,
  date date not null,
  amount numeric(15,2) not null,
  description text,
  fitid text, -- Financial Institution Transaction ID (OFX unique id)
  memo text,
  
  -- Status
  status text default 'pending' check (status in ('pending', 'matched', 'ignored')),
  
  -- Link to existing system transaction (Expense or Income)
  -- We might link to 'transactions' (if unified) or 'financial_payables' or 'appointments'?
  -- For now, let's assume we link to a generic transaction record if we have one, 
  -- OR we just mark it as reconciled.
  -- Let's create a generic 'reconciled_transaction_id' if we unify tables later,
  -- but for MVP, we'll store JSON reference or just simple ID if we know the table.
  -- Let's stick to simple: 'matched_payable_id' (for expenses) or 'matched_appointment_id' (for income)?
  -- Or better: A unified 'transactions' table is best. 
  -- DO WE HAVE A UNIFIED TRANSACTIONS TABLE?
  -- Checking migration_financial_payables.sql... "financial_payables".
  -- Checking appointments... "appointments".
  -- They are separate.
  -- We will add nullable FKs for now.
  matched_payable_id uuid references public.financial_payables(id),
  matched_appointment_id uuid references public.appointments(id),
  
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index for searching matches
create index if not exists idx_bank_transactions_date_amount on public.bank_transactions(date, amount);
create index if not exists idx_bank_transactions_fitid on public.bank_transactions(fitid);

-- B. Permissions
insert into public.permissions (code, description, module) values
('financial.reconcile', 'Acesso à conciliação bancária', 'Financeiro')
on conflict (code) do nothing;

-- Give to Master
do $$
declare
    mid uuid;
    pid uuid;
begin
    select id into mid from public.roles where name = 'Master';
    select id into pid from public.permissions where code = 'financial.reconcile';
    if mid is not null and pid is not null then
        insert into public.role_permissions (role_id, permission_id) values (mid, pid) on conflict do nothing;
    end if;
end $$;
