-- Check if user_authenticators table exists and is accessible
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE tablename = 'user_authenticators';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'user_authenticators';
