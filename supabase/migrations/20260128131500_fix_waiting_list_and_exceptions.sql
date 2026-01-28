-- Fix waiting_list missing columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'waiting_list' AND column_name = 'organization_id') THEN
        ALTER TABLE waiting_list ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'waiting_list' AND column_name = 'preferred_days') THEN
        ALTER TABLE waiting_list ADD COLUMN preferred_days text[]; -- Array of days (seg, ter, qua, qui, sex, sab)
    END IF;
END $$;

-- Create professional schedule exceptions (for Saturdays or specific dates)
CREATE TABLE IF NOT EXISTS professional_schedule_exceptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    date date NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    is_blocked boolean DEFAULT false, -- If true, this date is blocked. If false, it's an extra opening.
    created_at timestamptz DEFAULT now(),
    UNIQUE(profile_id, date)
);

-- RLS for exceptions
ALTER TABLE professional_schedule_exceptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" 
ON professional_schedule_exceptions FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
