-- 14. MIGRATION: Financial Payables & Status
-- Created at: 2025-12-16

-- Add support for tracking transaction status (Pending vs Paid)
alter table public.transactions 
add column if not exists status text default 'paid' check (status in ('pending', 'paid', 'cancelled')),
add column if not exists due_date date, -- Vencimento
add column if not exists paid_at timestamp with time zone, -- Data do Pagamento Efeito
add column if not exists is_recurring boolean default false,
add column if not exists recurrence_frequency text; -- 'monthly', 'yearly', etc.

-- Update existing transactions to be 'paid' and have paid_at = created_at or date
update public.transactions 
set status = 'paid', 
    paid_at = created_at, 
    due_date = date 
where status is null;

-- Index for faster filtering by status
create index if not exists idx_transactions_status on public.transactions(status);
create index if not exists idx_transactions_due_date on public.transactions(due_date);
