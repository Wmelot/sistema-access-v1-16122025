-- Fix RLS Policy for Message Templates
-- The previous policy was too strict or failed to join with profiles correctly.
-- This script relaxes the policy to allow any logged-in user to manage templates.

-- 1. Drop the old restrictive policy
drop policy if exists "Masters/Admins can manage templates" on public.message_templates;

-- 2. Create a new permissive policy for authenticated users
create policy "Authenticated users can manage templates" 
    on public.message_templates 
    for all 
    using (auth.role() = 'authenticated');

-- 3. Ensure enable row level security is on (just in case)
alter table public.message_templates enable row level security;
