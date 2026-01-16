
-- RESTORE MISSING AUTH FUNCTION & TRIGGER
-- This fixes the "Database error querying schema" by putting back the
-- function that the Auth Trigger was trying to call.

-- 1. Ensure the function exists (SECURITY DEFINER = runs as superuser)
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    default_org_id uuid;
    role_id uuid;
BEGIN
    -- 2. Insert into public.profiles
    INSERT INTO public.profiles (
        id, 
        full_name, 
        email, 
        organization_id,
        role,
        photo_url
    )
    VALUES (
        NEW.id, 
        NEW.raw_user_meta_data->>'full_name', 
        NEW.email, 
        NULL, -- No default org
        'physio', -- Default role
        NEW.raw_user_meta_data->>'avatar_url' -- Tries to set photo_url
    )
    ON CONFLICT (id) DO UPDATE
    SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;
        
    RETURN NEW;
END;
$function$;

-- 2. Grant permissions so Auth can call it
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated, service_role;

-- 3. RESET THE TRIGGER (Drop the old/broken one, Create the new one)
-- We wrap DROP in a block to catch potential "must be owner" errors smoothly
DO $$
BEGIN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Ignore if we can't drop (it might be gone or owned by system)
END $$;

-- Create the trigger again just to be sure it points to our NEW function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
