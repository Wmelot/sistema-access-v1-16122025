-- Create RPC function to bypass PostgREST cache issues for waiting_list
CREATE OR REPLACE FUNCTION add_to_waiting_list_rpc(
    p_service_id uuid,
    p_professional_id uuid,
    p_date date,
    p_patient_name text,
    p_patient_phone text,
    p_preference text,
    p_preferred_days text[],
    p_organization_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with permissions of the creator (bypass RLS if needed, but we should handle security)
AS $$
BEGIN
    INSERT INTO waiting_list (
        service_id,
        professional_id,
        date,
        patient_name,
        patient_phone,
        preference,
        preferred_days,
        organization_id,
        status,
        created_at
    ) VALUES (
        p_service_id,
        p_professional_id,
        p_date,
        p_patient_name,
        p_patient_phone,
        p_preference,
        p_preferred_days,
        p_organization_id,
        'pending',
        now()
    );
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION add_to_waiting_list_rpc TO authenticated;
GRANT EXECUTE ON FUNCTION add_to_waiting_list_rpc TO service_role;
GRANT EXECUTE ON FUNCTION add_to_waiting_list_rpc TO anon; -- Allow public booking to add to waitlist
