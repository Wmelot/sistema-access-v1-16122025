-- seed_test_followup_v2.sql

-- 1. Ensure Test Patient exists
INSERT INTO public.patients (id, name, phone, cpf, organization_id)
VALUES (
    '00000000-0000-0000-0000-000000000001', 
    'Paciente Teste Sandbox', 
    '5531991856084', 
    '000.000.000-01',
    (SELECT organization_id FROM public.profiles LIMIT 1) -- Use existing org from a profile
) 
ON CONFLICT (id) DO UPDATE 
SET phone = '5531991856084'; 

-- 2. Insert Follow-up
INSERT INTO public.assessment_follow_ups (
    patient_id, 
    type, 
    scheduled_date, 
    status, 
    delivery_date, 
    token
)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'insoles_40d',
    NOW() - INTERVAL '1 minute', -- Due now
    'pending',
    CURRENT_DATE,
    'seed-token-' || EXTRACT(EPOCH FROM NOW())
);

NOTIFY pgrst, 'reload schema';
