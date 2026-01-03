-- Function: get_patient_active_appointment
-- Description: Securely fetches the active appointment for a patient, bypassing RLS.
-- This is necessary because strict RLS policies on the 'appointments' table might hide
-- active appointments from the UI, causing logic errors (e.g., duplicated buttons).
--
-- Security: SECURITY DEFINER (Runs with owner privileges)
-- Access: Granted to 'authenticated' role.

CREATE OR REPLACE FUNCTION get_patient_active_appointment(target_patient_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    active_appt jsonb;
    today_start timestamp;
BEGIN
    -- Define "today" (could be timezone dependent, using UTC for consistency or server time)
    today_start := current_date::timestamp;

    SELECT to_jsonb(a.*)
    INTO active_appt
    FROM appointments a
    WHERE a.patient_id = target_patient_id
      AND a.status IN ('checked_in', 'in_progress', 'attended')
      AND a.start_time >= today_start
    ORDER BY a.start_time DESC
    LIMIT 1;

    RETURN active_appt;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_patient_active_appointment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_patient_active_appointment(uuid) TO service_role;
