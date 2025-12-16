-- Add Online Booking Configuration to Profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS online_booking_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS min_advance_booking_days INTEGER DEFAULT 0;

-- Comment on columns
COMMENT ON COLUMN public.profiles.online_booking_enabled IS 'If false, professional does not appear in public scheduling';
COMMENT ON COLUMN public.profiles.min_advance_booking_days IS 'Minimum days in advance for a booking (0 = same day ok, 1 = tomorrow, etc)';

-- Update RLS if necessary (usually public read is active for profiles, or strictly scoped)
-- Ensure 'update' policy includes these columns? RLS policies for UPDATE usually cover all columns if checks pass.
