-- Create Report Templates Table
CREATE TABLE IF NOT EXISTS report_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    type TEXT, -- Removed CHECK constraint to allow 'smart_report' and others
    category TEXT DEFAULT 'Laudos',
    content TEXT, -- Stores the HTML content
    config JSONB DEFAULT '{}', -- Stores layout, selected fields, static text
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Optional: link to creator
    is_public BOOLEAN DEFAULT false -- Optional: shared templates
);

-- RLS Policies
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates are viewable by everyone" ON report_templates
    FOR SELECT USING (true);

CREATE POLICY "Templates are insertable by authenticated users" ON report_templates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Templates are updatable by creators or admins" ON report_templates
    FOR UPDATE USING (
        auth.uid() = profile_id OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'master', 'manager'))
    );

CREATE POLICY "Templates are deletable by creators or admins" ON report_templates
    FOR DELETE USING (
        auth.uid() = profile_id OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'master', 'manager'))
    );
