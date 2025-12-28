-- Fix: Add missing columns to assessment_follow_ups table if they are missing
-- This handles the case where the table was created previously with a different schema

DO $$
BEGIN
    -- Add scheduled_date if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessment_follow_ups' AND column_name = 'scheduled_date') THEN
        ALTER TABLE assessment_follow_ups ADD COLUMN scheduled_date DATE;
    END IF;

    -- Add delivery_date if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessment_follow_ups' AND column_name = 'delivery_date') THEN
        ALTER TABLE assessment_follow_ups ADD COLUMN delivery_date DATE;
    END IF;

    -- Add type if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessment_follow_ups' AND column_name = 'type') THEN
        ALTER TABLE assessment_follow_ups ADD COLUMN type TEXT CHECK (type IN ('insoles_40d', 'insoles_1y'));
    END IF;

    -- Add status if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessment_follow_ups' AND column_name = 'status') THEN
        ALTER TABLE assessment_follow_ups ADD COLUMN status TEXT CHECK (status IN ('pending', 'sent', 'completed', 'cancelled', 'alert')) DEFAULT 'pending';
    END IF;

    -- Add token if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessment_follow_ups' AND column_name = 'token') THEN
        ALTER TABLE assessment_follow_ups ADD COLUMN token TEXT;
        ALTER TABLE assessment_follow_ups ADD CONSTRAINT assessment_follow_ups_token_key UNIQUE (token);
    END IF;

    -- Add response_data if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessment_follow_ups' AND column_name = 'response_data') THEN
        ALTER TABLE assessment_follow_ups ADD COLUMN response_data JSONB;
    END IF;

    -- Add sent_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessment_follow_ups' AND column_name = 'sent_at') THEN
        ALTER TABLE assessment_follow_ups ADD COLUMN sent_at TIMESTAMPTZ;
    END IF;
END $$;

-- Re-apply Index (Safe to run if column exists now)
CREATE INDEX IF NOT EXISTS idx_assessment_follow_ups_schedule_status 
ON assessment_follow_ups(scheduled_date, status);
