
-- Add professional_id if missing
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS professional_id uuid REFERENCES public.profiles(id);

-- Allow creating transactions without patient/product (Expenses)
ALTER TABLE public.transactions ALTER COLUMN patient_id DROP NOT NULL;
ALTER TABLE public.transactions ALTER COLUMN product_id DROP NOT NULL;

-- Ensure category is text
ALTER TABLE public.transactions ALTER COLUMN category TYPE text USING category::text;
  
