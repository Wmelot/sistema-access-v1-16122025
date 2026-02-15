-- Migration to upgrade assessment_follow_ups table to support multi-tenancy and custom messages
-- Adds missing columns and fixes constraints

DO $$ 
BEGIN
    -- 1. Check if table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assessment_follow_ups') THEN
        -- Create table if it doesn't exist at all (safety measure)
        CREATE TABLE public.assessment_follow_ups (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
            scheduled_date TIMESTAMPTZ NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            token TEXT UNIQUE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;

    -- 2. Add custom_message
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessment_follow_ups' AND column_name = 'custom_message') THEN
        ALTER TABLE public.assessment_follow_ups ADD COLUMN custom_message TEXT;
    END IF;

    -- 3. Add original_assessment_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessment_follow_ups' AND column_name = 'original_assessment_id') THEN
        ALTER TABLE public.assessment_follow_ups ADD COLUMN original_assessment_id UUID;
    END IF;

    -- 4. Add organization_id (Multi-tenancy)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessment_follow_ups' AND column_name = 'organization_id') THEN
        ALTER TABLE public.assessment_follow_ups ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
        CREATE INDEX IF NOT EXISTS idx_assessment_follow_ups_organization ON public.assessment_follow_ups(organization_id);
    END IF;

    -- 5. Add link_expires_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessment_follow_ups' AND column_name = 'link_expires_at') THEN
        ALTER TABLE public.assessment_follow_ups ADD COLUMN link_expires_at TIMESTAMPTZ;
    END IF;

    -- 6. Add questionnaire_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessment_follow_ups' AND column_name = 'questionnaire_type') THEN
        ALTER TABLE public.assessment_follow_ups ADD COLUMN questionnaire_type TEXT;
    END IF;

    -- 7. Add created_by
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessment_follow_ups' AND column_name = 'created_by') THEN
        ALTER TABLE public.assessment_follow_ups ADD COLUMN created_by UUID;
    END IF;

    -- 8. Add template_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessment_follow_ups' AND column_name = 'template_id') THEN
        ALTER TABLE public.assessment_follow_ups ADD COLUMN template_id UUID;
    END IF;

    -- 9. Fix scheduled_date type (DATE -> TIMESTAMPTZ)
    IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'assessment_follow_ups' AND column_name = 'scheduled_date') = 'date' THEN
        ALTER TABLE public.assessment_follow_ups ALTER COLUMN scheduled_date TYPE TIMESTAMPTZ USING scheduled_date::TIMESTAMPTZ;
    END IF;

    -- 10. Fix delivery_date (Make nullable as it's often null until sent)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessment_follow_ups' AND column_name = 'delivery_date') THEN
        ALTER TABLE public.assessment_follow_ups ALTER COLUMN delivery_date DROP NOT NULL;
    END IF;

    -- 11. Drop restrictive check constraint on 'type' if it exists
    -- The original schema had: CHECK (type IN ('insoles_40d', 'insoles_1y'))
    IF EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_name = 'assessment_follow_ups' AND column_name = 'type'
    ) THEN
        -- We just drop all check constraints on this table for 'type' to be safe
        DO '
        DECLARE
            r RECORD;
        BEGIN
            FOR r IN (SELECT constraint_name FROM information_schema.check_constraints WHERE constraint_schema = ''public'' AND constraint_name LIKE ''%assessment_follow_ups_type_check%'') LOOP
                EXECUTE ''ALTER TABLE public.assessment_follow_ups DROP CONSTRAINT '' || quote_ident(r.constraint_name);
            END LOOP;
        END ';
    END IF;

    -- 12. Make 'type' column optional (we use questionnaire_type now)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessment_follow_ups' AND column_name = 'type') THEN
        ALTER TABLE public.assessment_follow_ups ALTER COLUMN type DROP NOT NULL;
    END IF;

END $$;

-- Enable RLS
ALTER TABLE public.assessment_follow_ups ENABLE ROW LEVEL SECURITY;

-- Set up RLS Policies
DROP POLICY IF EXISTS "Users can view followups from their organization" ON public.assessment_follow_ups;
CREATE POLICY "Users can view followups from their organization"
ON public.assessment_follow_ups FOR SELECT
USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can create followups for their organization" ON public.assessment_follow_ups;
CREATE POLICY "Users can create followups for their organization"
ON public.assessment_follow_ups FOR INSERT
WITH CHECK (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update followups from their organization" ON public.assessment_follow_ups;
CREATE POLICY "Users can update followups from their organization"
ON public.assessment_follow_ups FOR UPDATE
USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

-- Note: No RLS for public token access because validateFollowupToken uses Admin Client (service_role)
