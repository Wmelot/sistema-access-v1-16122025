-- 20260111150000_add_org_features.sql

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}'::jsonb;

-- Update existing organizations with defaults
-- Master (Axiom Central) -> All features
UPDATE public.organizations
SET features = '{
    "ai_assistant": true,
    "advanced_reports": true,
    "custom_forms": 99,
    "whatsapp_integration": true,
    "teleconsultation": true
}'::jsonb
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Client (Access Fisioterapia) -> Professional Plan (Example)
UPDATE public.organizations
SET features = '{
    "ai_assistant": true,
    "advanced_reports": true,
    "custom_forms": 10,
    "whatsapp_integration": true,
    "teleconsultation": false
}'::jsonb
WHERE id = '00000000-0000-0000-0000-000000000002';
