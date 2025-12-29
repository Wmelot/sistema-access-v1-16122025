-- seed_appointment.sql
DO $$
DECLARE
    pid uuid;
    sid uuid;
    prof_id uuid;
BEGIN
    -- Get Sandbox details
    SELECT id INTO pid FROM public.patients WHERE phone = '5531991856084' OR phone = '31991856084' LIMIT 1;
    SELECT id INTO sid FROM public.services LIMIT 1;
    SELECT id INTO prof_id FROM public.profiles WHERE role = 'admin' OR role = 'physio' LIMIT 1;

    IF pid IS NULL THEN
        RAISE NOTICE 'Sandbox patient not found, creating...';
        INSERT INTO public.patients (id, name, phone) 
        VALUES (gen_random_uuid(), 'Paciente Teste Webhook', '5531991856084')
        RETURNING id INTO pid;
    END IF;

    -- Create Appointment Tomorrow
    INSERT INTO public.appointments (patient_id, professional_id, service_id, start_time, end_time, status, price)
    VALUES (
        pid,
        prof_id,
        sid,
        NOW() + INTERVAL '1 day',
        NOW() + INTERVAL '1 day' + INTERVAL '1 hour',
        'scheduled', -- Not confirmed yet
        100.00
    );

    RAISE NOTICE 'Appointment created for patient %', pid;
END $$;
