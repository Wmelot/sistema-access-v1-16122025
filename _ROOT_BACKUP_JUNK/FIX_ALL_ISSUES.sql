-- FIX ALL CRITICAL ISSUES (ROBUST VERSION)

-- 1. Create Reminders Table (if missing)
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending', 
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fix permissions
GRANT ALL ON public.reminders TO postgres, authenticated, service_role;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- DROP ALL EXISTING POLICIES ON REMINDERS TO RESET
DROP POLICY IF EXISTS "Users can view their own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can create reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can update their own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can delete their own reminders" ON public.reminders;

-- Recreate Policies for Reminders
CREATE POLICY "Users can view their own reminders" ON public.reminders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create reminders" ON public.reminders
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own reminders" ON public.reminders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders" ON public.reminders
    FOR DELETE USING (auth.uid() = user_id);


-- 2. FIX PROFILES INFINITE RECURSION
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- DROP ALL POSSIBLE CONFLICTING POLICIES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Diffusive View" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles; 
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

-- Create SAFE policies
CREATE POLICY "Users can view own profile" ON public.profiles 
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view all profiles" ON public.profiles 
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON public.profiles 
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles 
    FOR INSERT WITH CHECK (auth.uid() = id);


-- 3. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
