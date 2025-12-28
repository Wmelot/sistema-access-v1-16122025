-- Fix: Consolidate scheduled_for and scheduled_date columns
-- The goal is to have a single 'scheduled_date' column that is NOT NULL.

DO $$
BEGIN
    -- Check if 'scheduled_for' exists (the problematic column)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessment_follow_ups' AND column_name = 'scheduled_for') THEN
        
        -- Check if 'scheduled_date' ALSO exists (from our recent fix)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessment_follow_ups' AND column_name = 'scheduled_date') THEN
             -- 1. Copy data from scheduled_for to scheduled_date for any existing rows
             -- (Cast to DATE if it was TIMESTAMP, though unlikely strictly needed)
             UPDATE assessment_follow_ups 
             SET scheduled_date = CAST(scheduled_for AS DATE) 
             WHERE scheduled_date IS NULL;
             
             -- 2. Drop the problematic 'scheduled_for' column
             ALTER TABLE assessment_follow_ups DROP COLUMN scheduled_for;
             
             -- 3. Ensure 'scheduled_date' is NOT NULL
             ALTER TABLE assessment_follow_ups ALTER COLUMN scheduled_date SET NOT NULL;
             
        ELSE
             -- Case: Only 'scheduled_for' exists. Just rename it.
             ALTER TABLE assessment_follow_ups RENAME COLUMN scheduled_for TO scheduled_date;
        END IF;

    END IF;
    
    -- Safety check: Ensure 'scheduled_date' exists and is NOT NULL now
     IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessment_follow_ups' AND column_name = 'scheduled_date') THEN
        ALTER TABLE assessment_follow_ups ALTER COLUMN scheduled_date SET NOT NULL;
     END IF;

END $$;
