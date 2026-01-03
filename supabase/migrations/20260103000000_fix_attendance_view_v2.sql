-- Drop previous function to avoid confusion (optional, but good practice)
DROP FUNCTION IF EXISTS get_patient_active_appointment(uuid);

-- Create VIEW for Active Appointments
-- By default, Views in Postgres run with the permissions of the View Owner (us/postgres),
-- effectively bypassing RLS on the underlying 'appointments' table for the invoker (authenticated user),
-- UNLESS 'security_invoker' is set to true. We leave it false (default).

CREATE OR REPLACE VIEW patient_active_appointments_view AS
SELECT 
    a.id,
    a.patient_id,
    a.status,
    a.start_time,
    a.created_at,
    p.name as patient_name
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
WHERE 
    a.status IN ('checked_in', 'in_progress', 'attended')
    -- Filter last 24h to avoid picking up old stale stuff, but ensuring uniqueness
    AND a.start_time >= (now() - interval '24 hours');

-- Grant permissions
GRANT SELECT ON patient_active_appointments_view TO authenticated;
GRANT SELECT ON patient_active_appointments_view TO service_role;
