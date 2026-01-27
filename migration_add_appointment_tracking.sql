-- Add appointment tracking to message logs
ALTER TABLE public.message_logs 
ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS trigger_type TEXT;

-- Create index for faster check in the cron
CREATE INDEX IF NOT EXISTS idx_message_logs_appointment_trigger ON public.message_logs(appointment_id, trigger_type);
