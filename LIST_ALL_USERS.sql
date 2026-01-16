
-- DETECTIVE MODE: LIST ALL USERS
-- Something is wrong. You are logged in, but the database says "nobody is home".
-- Are we looking at the wrong project?

SELECT 
    id, 
    email, 
    created_at, 
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 50;
