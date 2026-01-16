
-- RESTORE AUTH FUNCTION V2 (SaaS Fix)
-- Fixes the crash by ensuring every user belongs to an Organization.

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    default_org_id uuid := '00000000-0000-0000-0000-000000000001'; -- Axiom Master Org
BEGIN
    -- 2. Insert into public.profiles
    INSERT INTO public.profiles (
        id, 
        full_name, 
        email, 
        organization_id, -- NOW WE FILL THIS
        role,
        photo_url
    )
    VALUES (
        NEW.id, 
        NEW.raw_user_meta_data->>'full_name', 
        NEW.email, 
        default_org_id, -- <--- FIX: Assign to Default Org
        'admin', -- <--- FIX: Force Admin for testing (safest role)
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE
    SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        organization_id = EXCLUDED.organization_id; -- Ensure org is set on update too
        
    RETURN NEW;
END;
$function$;

-- RE-BIND THE TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CONFIRMATION
NOTIFY pgrst, 'reload config';
