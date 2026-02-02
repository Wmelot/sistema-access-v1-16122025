-- EMERGENCY: Terminate all other connections to free up the pool
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE pid <> pg_backend_pid()
  AND datname = 'postgres'; -- Default local DB name, adjust if strict 

-- Verify it worked
SELECT count(*) as active_connections FROM pg_stat_activity;
