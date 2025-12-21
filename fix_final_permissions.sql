-- FIX: Ensure Table Exists & Fix RLS Policies (Comprehensive)

-- 1. Ensure Table Exists (Migration might have been skipped)
CREATE TABLE IF NOT EXISTS public.report_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    type TEXT,
    category TEXT DEFAULT 'Laudos',
    content TEXT, -- HTML Content
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT false
);

-- 2. Drop existing broken policies to ensure clean slate
DROP POLICY IF EXISTS "Templates are updatable by creators or admins" ON report_templates;
DROP POLICY IF EXISTS "Templates are deletable by creators or admins" ON report_templates;
DROP POLICY IF EXISTS "Templates are insertable by authenticated users" ON report_templates;
DROP POLICY IF EXISTS "Templates are viewable by everyone" ON report_templates;

-- 3. Re-Enable RLS
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

-- 4. Create Correct Policies (RBAC Aware)

-- VIEW: Everyone authenticated can see (or filter by public/own if needed, but 'true' is fine for now)
CREATE POLICY "Templates are viewable by authenticated" ON report_templates
    FOR SELECT USING (auth.role() = 'authenticated');

-- INSERT: Authenticated users can create
CREATE POLICY "Templates are insertable by authenticated users" ON report_templates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- UPDATE: Creator OR Master/Manager/Admin/Sócio
CREATE POLICY "Templates are updatable by owners or admins" ON report_templates
    FOR UPDATE USING (
        auth.uid() = profile_id OR 
        EXISTS (
            SELECT 1 FROM profiles p
            LEFT JOIN roles r ON p.role_id = r.id
            WHERE p.id = auth.uid() 
            -- Check both new relation and legacy column for safety
            AND (r.name IN ('Master', 'Manager', 'Admin', 'Sócio', 'socio') OR p.role IN ('master', 'manager', 'admin'))
        )
    );

-- DELETE: Creator OR Master/Manager/Admin/Sócio
CREATE POLICY "Templates are deletable by owners or admins" ON report_templates
    FOR DELETE USING (
        auth.uid() = profile_id OR 
        EXISTS (
            SELECT 1 FROM profiles p
            LEFT JOIN roles r ON p.role_id = r.id
            WHERE p.id = auth.uid() 
            AND (r.name IN ('Master', 'Manager', 'Admin', 'Sócio', 'socio') OR p.role IN ('master', 'manager', 'admin'))
        )
    );

-- 5. FIX PROFILES VISIBILITY (For Dropdown)
DROP POLICY IF EXISTS "Profiles viewable by self or master" ON profiles;

CREATE POLICY "Profiles viewable by self or master" ON profiles
    FOR SELECT USING (
        auth.uid() = id OR
        EXISTS (
            SELECT 1 FROM profiles p
            LEFT JOIN roles r ON p.role_id = r.id
            WHERE p.id = auth.uid() 
            AND (r.name IN ('Master', 'Manager', 'Admin', 'Sócio', 'socio') OR p.role IN ('master', 'manager', 'admin'))
        )
    );

-- 6. Permissions
GRANT ALL ON report_templates TO authenticated;
GRANT ALL ON profiles TO authenticated;
