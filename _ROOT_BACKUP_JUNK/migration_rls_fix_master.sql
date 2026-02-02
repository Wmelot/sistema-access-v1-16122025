-- [RLS FIX] Allow Master/Admin/Manager to view ALL appointments

-- 1. Drop existing policy (if strictly limiting to own)
-- Note: We don't know the exact name, so we'll try to create a new permissible one or replace.
-- Assuming standard name "Users can view their own appointments"

DROP POLICY IF EXISTS "Users can view all appointments if master" ON "appointments";

CREATE POLICY "Users can view all appointments if master"
ON "appointments"
FOR SELECT
USING (
  (auth.uid() = professional_id) OR 
  (auth.uid() IN (
    SELECT id FROM profiles 
    WHERE role IN ('master', 'admin', 'manager')
  ))
);

-- Ensure Insert/Update also allows Masters
DROP POLICY IF EXISTS "Master can insert appointments" ON "appointments";
CREATE POLICY "Master can insert appointments"
ON "appointments"
FOR INSERT
WITH CHECK (
  (auth.uid() = professional_id) OR 
  (auth.uid() IN (
    SELECT id FROM profiles 
    WHERE role IN ('master', 'admin', 'manager')
  ))
);

DROP POLICY IF EXISTS "Master can update appointments" ON "appointments";
CREATE POLICY "Master can update appointments"
ON "appointments"
FOR UPDATE
USING (
  (auth.uid() = professional_id) OR 
  (auth.uid() IN (
    SELECT id FROM profiles 
    WHERE role IN ('master', 'admin', 'manager')
  ))
);

DROP POLICY IF EXISTS "Master can delete appointments" ON "appointments";
CREATE POLICY "Master can delete appointments"
ON "appointments"
FOR DELETE
USING (
  (auth.uid() = professional_id) OR 
  (auth.uid() IN (
    SELECT id FROM profiles 
    WHERE role IN ('master', 'admin', 'manager')
  ))
);
