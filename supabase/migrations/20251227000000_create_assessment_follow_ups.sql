-- Create assessment_follow_ups table
CREATE TABLE IF NOT EXISTS assessment_follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('insoles_40d', 'insoles_1y')),
    scheduled_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'completed', 'cancelled', 'alert')) DEFAULT 'pending',
    delivery_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata for tracking the sent message or responses
    sent_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    response_data JSONB, -- Store the answers snapshot
    token TEXT UNIQUE -- For public access
);

-- Index for cron job performance
CREATE INDEX IF NOT EXISTS idx_assessment_follow_ups_schedule_status 
ON assessment_follow_ups(scheduled_date, status);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_assessment_follow_ups_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assessment_follow_ups_modtime
BEFORE UPDATE ON assessment_follow_ups
FOR EACH ROW
EXECUTE FUNCTION update_assessment_follow_ups_modtime();
