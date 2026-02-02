-- Add organization_id to Appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS organization_id UUID;
