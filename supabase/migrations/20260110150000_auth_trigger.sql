-- triggers/on_auth_user_created.sql
-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    default_org_id uuid;
    role_id uuid;
BEGIN
    -- 2. Insert into public.profiles
    -- We copy data from auth.users metadata if available
    INSERT INTO public.profiles (
        id, 
        full_name, 
        email, 
        organization_id,
        role, -- legacy
        photo_url
    )
    VALUES (
        NEW.id, 
        NEW.raw_user_meta_data->>'full_name', 
        NEW.email, 
        NULL, -- CHANGED: Do not auto-assign an organization.
        'physio', -- default role (changed from 'user' to fix constraint violation)
        NEW.raw_user_meta_data->>'avatar_url' -- Map auth metadata avatar to profile photo_url
    )
    ON CONFLICT (id) DO UPDATE
    SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
