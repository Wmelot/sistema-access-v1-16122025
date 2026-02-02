-- Add settings columns to profiles if they don't exist
alter table public.profiles 
add column if not exists slot_interval integer default 30,
add column if not exists allow_overbooking boolean default false,
add column if not exists online_booking_enabled boolean default true,
add column if not exists min_advance_booking_days integer default 0;

-- Update existing profiles to have default 30 if null (optional, but good for consistency)
update public.profiles 
set slot_interval = 30 
where slot_interval is null;
