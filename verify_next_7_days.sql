-- Check for birthdays in the next 7 days (Dec 21 to Dec 28)
-- Handling year wrap-around is not strictly needed for Dec 21, but good to have.

WITH upcoming_range AS (
    SELECT 
        CURRENT_DATE as start_date, 
        CURRENT_DATE + INTERVAL '7 days' as end_date
)
SELECT 
    'Patient' as type,
    name, 
    date_of_birth,
    to_char(date_of_birth, 'DD/MM') as birthday_day
FROM patients, upcoming_range
WHERE 
    date_of_birth IS NOT NULL 
    AND (
        -- Simple check for same year (focusing on Month-Day)
        (EXTRACT(MONTH FROM date_of_birth) = EXTRACT(MONTH FROM start_date) AND EXTRACT(DAY FROM date_of_birth) >= EXTRACT(DAY FROM start_date))
        OR 
        (EXTRACT(MONTH FROM date_of_birth) = EXTRACT(MONTH FROM end_date) AND EXTRACT(DAY FROM date_of_birth) <= EXTRACT(DAY FROM end_date))
    )
    -- Just a rough filter, let's look at specific dates manually in output
    AND EXTRACT(MONTH FROM date_of_birth) IN (12, 1)

UNION ALL

SELECT 
    'Professional' as type,
    full_name as name, 
    date_of_birth,
    to_char(date_of_birth, 'DD/MM') as birthday_day
FROM profiles, upcoming_range
WHERE 
    date_of_birth IS NOT NULL 
    AND (
        (EXTRACT(MONTH FROM date_of_birth) = EXTRACT(MONTH FROM start_date) AND EXTRACT(DAY FROM date_of_birth) >= EXTRACT(DAY FROM start_date))
        OR 
        (EXTRACT(MONTH FROM date_of_birth) = EXTRACT(MONTH FROM end_date) AND EXTRACT(DAY FROM date_of_birth) <= EXTRACT(DAY FROM end_date))
    )
    AND EXTRACT(MONTH FROM date_of_birth) IN (12, 1);
