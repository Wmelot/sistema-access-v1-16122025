-- Force PostgREST schema cache reload (Attempt 2)
NOTIFY pgrst, 'reload config';
-- Dummy change to ensure migration runs if needed, but the file name is unique so it runs.
