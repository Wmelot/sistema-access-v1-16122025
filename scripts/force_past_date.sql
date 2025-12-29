-- force_past_date.sql
UPDATE public.assessment_follow_ups 
SET scheduled_date = NOW() - INTERVAL '1 day', status = 'pending'
WHERE id = '6a6682cf-8e35-49ca-b913-3d170c4f1c92'; -- The ID from previous result
