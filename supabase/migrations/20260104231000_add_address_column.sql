-- Add JSON Address Column to Patients
-- The application code expects a single 'address' column to store full address data (JSON).
-- The base schema only had address_zip and address_street, risking data loss for City/State/Number.

-- 1. Add address column (JSONB is better for querying, but Text is what code seemingly sends/parses)
-- Code uses JSON.stringify, so it sends a string. Queries use JSON.parse.
-- We can use TEXT or JSONB. Postgres creates JSONB from string automatically usually if casted, but code sends string.
-- Let's use JSONB for future proofing, passing string usually works if driver handles it, or TEXT if we want to be safe with current code 'as string'.
-- Looking at patients.ts: const addressStorage = JSON.stringify(...) -> It's a string.
-- Let's use JSONB and rely on Postgres casting or driver. Or TEXT to be 100% safe with existing "string" logic.
-- Given "Could not find the 'address' column ... in schema cache" error, Supabase/PostgREST exposes it.
-- Let's use JSONB to allow future indexing.

ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS address JSONB;

-- 2. Migrate existing data (Optional)
-- If there are rows with address_street but no address, we could construct it.
-- UPDATE public.patients 
-- SET address = jsonb_build_object('street', address_street, 'zip_code', address_zip)
-- WHERE address IS NULL AND address_street IS NOT NULL;

-- Reload Schema
NOTIFY pgrst, 'reload config';
