-- debug_followups_v3.sql
SELECT 
    id, 
    status, 
    scheduled_date, 
    delivery_date, 
    created_at 
FROM public.assessment_follow_ups;

SELECT * FROM public.api_integrations;
