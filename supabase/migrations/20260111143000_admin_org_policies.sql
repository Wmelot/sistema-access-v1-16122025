-- 20260111143000_admin_org_policies.sql

-- Ensure RLS is enabled
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Policy for INSERT (Creation)
-- Only Master Admin (org ...0001) can create new organizations
CREATE POLICY "Master Admin can insert organizations"
ON public.organizations FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND organization_id = '00000000-0000-0000-0000-000000000001'
        AND role = 'admin'
    )
);

-- Policy for UPDATE
-- Master Admin can update ALL. Users can update their OWN (if admin of that org).
CREATE POLICY "Master Admin or Org Admin can update organizations"
ON public.organizations FOR UPDATE
USING (
    -- Master Admin
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND organization_id = '00000000-0000-0000-0000-000000000001'
        AND role = 'admin'
    )
    OR
    -- Org Admin (Own Org)
    (
        id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
        AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
);

-- Policy for DELETE
-- Only Master Admin can delete
CREATE POLICY "Master Admin can delete organizations"
ON public.organizations FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND organization_id = '00000000-0000-0000-0000-000000000001'
        AND role = 'admin'
    )
);
