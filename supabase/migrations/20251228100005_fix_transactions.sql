-- Fix Transactions Table Schema

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'canceled')),
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS due_date DATE DEFAULT current_date,
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS professional_id UUID REFERENCES public.profiles(id);

-- Reload Schema
NOTIFY pgrst, 'reload config';
