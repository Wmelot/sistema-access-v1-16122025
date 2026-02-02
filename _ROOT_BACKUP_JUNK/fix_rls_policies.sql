-- Fix RLS policy error for user_authenticators
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own authenticators" ON public.user_authenticators;
DROP POLICY IF EXISTS "Users can insert their own authenticators" ON public.user_authenticators;
DROP POLICY IF EXISTS "Users can update their own authenticators" ON public.user_authenticators;
DROP POLICY IF EXISTS "Users can delete their own authenticators" ON public.user_authenticators;

-- Create new policies with proper syntax
CREATE POLICY "user_authenticators_select_policy"
    ON public.user_authenticators
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "user_authenticators_insert_policy"
    ON public.user_authenticators
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_authenticators_update_policy"
    ON public.user_authenticators
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_authenticators_delete_policy"
    ON public.user_authenticators
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Force schema reload
NOTIFY pgrst, 'reload schema';
