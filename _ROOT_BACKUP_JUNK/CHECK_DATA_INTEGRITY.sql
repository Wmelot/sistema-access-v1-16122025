
-- CHECK DATA INTEGRITY (PANIC MODE)
-- Counts all rows in critical tables to see if data was deleted or just hidden.

SELECT 
    (SELECT COUNT(*) FROM public.patients) as total_patients,
    (SELECT COUNT(*) FROM public.assessments) as total_assessments,
    (SELECT COUNT(*) FROM public.clinical_protocols) as total_protocols,
    (SELECT COUNT(*) FROM public.profiles) as total_profiles,
    (SELECT COUNT(*) FROM auth.users) as total_users;
