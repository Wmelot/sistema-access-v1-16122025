-- Ensure table exists (redundant but safe)
CREATE TABLE IF NOT EXISTS assessment_follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('insoles_40d', 'insoles_1y')),
    scheduled_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'completed', 'cancelled', 'alert')) DEFAULT 'pending',
    delivery_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    response_data JSONB,
    token TEXT UNIQUE
);

-- Enable RLS
ALTER TABLE assessment_follow_ups ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- 1. Allow authenticated users (dashboard users) to view and manage all follow ups
CREATE POLICY "Enable all for users" ON assessment_follow_ups
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 2. Allow public access via TOKEN for specific updates (if we had a public endpoint, 
-- but here we mostly use server actions. For safety, keep it authenticated for now).

-- Fix: Grant permissions to postgres/anon/authenticated roles explicitly if needed in some setups
GRANT ALL ON assessment_follow_ups TO authenticated;
GRANT ALL ON assessment_follow_ups TO service_role;
