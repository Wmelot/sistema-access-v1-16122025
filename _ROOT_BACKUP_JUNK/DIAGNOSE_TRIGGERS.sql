
-- DIAGNOSE: LIST TRIGGERS ON AUTH.USERS
-- This will tell us the NAME of the trigger causing problems.

SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
AND event_object_table = 'users';
