-- 15. MIGRATION: Link Transactions to Professionals
-- Created at: 2025-12-16

alter table public.transactions
add column if not exists professional_id uuid references public.profiles(id);

-- Index for faster filtering
create index if not exists idx_transactions_professional_id on public.transactions(professional_id);
