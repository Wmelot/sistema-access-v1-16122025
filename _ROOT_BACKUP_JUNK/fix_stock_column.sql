-- Execute this in your Supabase SQL Editor to fix the "stock_quantity" error.

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
