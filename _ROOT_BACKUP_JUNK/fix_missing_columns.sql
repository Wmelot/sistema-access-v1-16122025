-- Execute this in your Supabase SQL Editor to fix the "Product Saving" error.

-- Add 'is_unlimited' column for stock control
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_unlimited BOOLEAN DEFAULT FALSE;

-- Add 'cost_price' column if it's missing
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS cost_price NUMERIC DEFAULT 0;

-- Optional: Create index if needed (usually not for these)
