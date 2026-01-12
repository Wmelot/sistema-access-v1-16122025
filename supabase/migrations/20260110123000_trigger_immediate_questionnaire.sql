-- Enable pg_net extension for HTTP requests
create extension if not exists pg_net with schema extensions;

-- Function to handle the trigger
create or replace function public.trigger_automated_questionnaire()
returns trigger
language plpgsql
security definer
as $$
declare
    -- REPLACE THESE VALUES BEFORE RUNNING
    project_url text := 'https://robptuukezhqvtasjyhz.supabase.co/functions/v1/send-automated-questionnaires'; 
    service_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYnB0dXVrZXpocXZ0YXNqeWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ4NjcwMCwiZXhwIjoyMDgzMDYyNzAwfQ.hufdKEjY0XFSIYvrv7FrNyb2aX49JORBulplO19d0u4';
begin
    -- Check if appointment is within the next 48 hours (immediate scope)
    -- If it's further away, the daily Cron will catch it later.
    if NEW.start_time < (now() + interval '2 days') then

        -- Perform HTTP POST to the Edge Function
        perform extensions.net_http_post(
            url := project_url,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || service_key
            ),
            body := jsonb_build_object('appointment_id', NEW.id)
        );
        
    end if;

    return NEW;
end;
$$;

-- Create the Trigger
drop trigger if exists on_appointment_created_questionnaire on public.appointments;

create trigger on_appointment_created_questionnaire
    after insert
    on public.appointments
    for each row
    when (NEW.injury_region is not null) 
    execute function public.trigger_automated_questionnaire();
