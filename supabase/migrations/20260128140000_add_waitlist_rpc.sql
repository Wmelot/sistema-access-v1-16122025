-- RPC to bypass PostgREST schema cache for waiting_list
-- This function allows direct insertion into the table even if the schema cache is outdated.

CREATE OR REPLACE FUNCTION add_to_waiting_list_rpc(
    p_service_id UUID,
    p_professional_id UUID,
    p_date DATE,
    p_patient_name TEXT,
    p_patient_phone TEXT,
    p_preference TEXT,
    p_preferred_days TEXT[],
    p_organization_id UUID,
    p_status TEXT DEFAULT 'pending'
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.waiting_list (
        service_id,
        professional_id,
        date,
        patient_name,
        patient_phone,
        preference,
        preferred_days,
        organization_id,
        status
    ) VALUES (
        p_service_id,
        p_professional_id,
        p_date,
        p_patient_name,
        p_patient_phone,
        p_preference,
        p_preferred_days,
        p_organization_id,
        p_status
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
