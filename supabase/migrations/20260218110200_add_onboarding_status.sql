-- Add onboarding status to profiles
alter table public.profiles
add column if not exists has_completed_onboarding boolean default false;

-- Also add a column for organization onboarding, if you want something clinic-wide, 
-- but individual user onboarding is safer for this request.
