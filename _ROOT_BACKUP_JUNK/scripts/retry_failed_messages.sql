-- retry_failed_messages.sql
UPDATE public.assessment_follow_ups 
SET status = 'pending', updated_at = NOW() 
WHERE status = 'failed' OR status = 'alert'; -- Retry failed and alert ones

UPDATE public.campaign_messages
SET status = 'pending', updated_at = NOW()
WHERE status = 'failed';
