-- Add invoice_id to appointments table

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES public.invoices(id);

-- Reload Schema
NOTIFY pgrst, 'reload config';
