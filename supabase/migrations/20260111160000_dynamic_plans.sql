-- 20260111160000_dynamic_plans.sql

-- 1. Create Plan Configs Table
CREATE TABLE IF NOT EXISTS public.plan_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    features JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Seed Default Plans
INSERT INTO public.plan_configs (name, slug, features)
VALUES 
    ('Basic (Free)', 'free', '{
        "ai_assistant": false,
        "advanced_reports": false,
        "custom_forms": 1,
        "whatsapp_integration": false,
        "teleconsultation": false,
        "marketing_module": false,
        "financial_module": true
    }'::jsonb),
    ('Professional', 'clinic', '{
        "ai_assistant": true,
        "advanced_reports": true,
        "custom_forms": 10,
        "whatsapp_integration": true,
        "teleconsultation": false,
        "marketing_module": true,
        "financial_module": true
    }'::jsonb),
    ('Axiom Prime', 'enterprise', '{
        "ai_assistant": true,
        "advanced_reports": true,
        "custom_forms": 99,
        "whatsapp_integration": true,
        "teleconsultation": true,
        "marketing_module": true,
        "financial_module": true
    }'::jsonb)
ON CONFLICT (slug) DO UPDATE
SET features = EXCLUDED.features;

-- 3. Link Organizations to Plans
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS plan_config_id UUID REFERENCES public.plan_configs(id);

-- 4. Backfill plan_config_id based on existing 'plan' text
UPDATE public.organizations
SET plan_config_id = (SELECT id FROM public.plan_configs WHERE slug = organizations.plan)
WHERE plan_config_id IS NULL;

-- Default fallback if plan doesn't match slug
UPDATE public.organizations
SET plan_config_id = (SELECT id FROM public.plan_configs WHERE slug = 'free')
WHERE plan_config_id IS NULL;

-- 5. Trigger Function: Sync Features
-- When Plan Config changes OR Org Plan changes, update Org Features to match Plan Features
CREATE OR REPLACE FUNCTION public.sync_org_features_from_plan()
RETURNS TRIGGER AS $$
BEGIN
    -- If triggered by organizations change (new org or changed plan_config_id)
    IF TG_TABLE_NAME = 'organizations' THEN
        IF NEW.plan_config_id IS NOT NULL THEN
            NEW.features := (SELECT features FROM public.plan_configs WHERE id = NEW.plan_config_id);
        END IF;
        RETURN NEW;
    
    -- If triggered by plan_configs change (updated features)
    ELSIF TG_TABLE_NAME = 'plan_configs' THEN
        -- Update all organizations that use this plan
        UPDATE public.organizations
        SET features = NEW.features
        WHERE plan_config_id = NEW.id;
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 6. Triggers
-- On Org Insert/Update of plan_config_id
DROP TRIGGER IF EXISTS tr_org_sync_features ON public.organizations;
CREATE TRIGGER tr_org_sync_features
BEFORE INSERT OR UPDATE OF plan_config_id
ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.sync_org_features_from_plan();

-- On Plan Config Update of features
DROP TRIGGER IF EXISTS tr_plan_sync_features ON public.plan_configs;
CREATE TRIGGER tr_plan_sync_features
AFTER UPDATE OF features
ON public.plan_configs
FOR EACH ROW
EXECUTE FUNCTION public.sync_org_features_from_plan();

-- 7. RLS for Plans
ALTER TABLE public.plan_configs ENABLE ROW LEVEL SECURITY;

-- Master Admin can manage plans
CREATE POLICY "Master Admin can manage plans"
ON public.plan_configs
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND (email = 'accessfisio@gmail.com' OR role = 'admin') -- Simplified for Master context
    )
);

-- Everyone can view plans (needed for signup/display)
CREATE POLICY "Everyone can view descriptions of plans"
ON public.plan_configs FOR SELECT
USING (true);
