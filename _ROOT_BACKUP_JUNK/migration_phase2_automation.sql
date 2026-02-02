-- ==============================================================================
-- PHASE 2: INTELLIGENT AUTOMATION MIGRATION
-- Includes: Commission Rules table, Indexes for Financial Reports
-- ==============================================================================

-- 1. COMMISSION RULES TABLE
-- Defines how much a professional earns per service
CREATE TABLE IF NOT EXISTS professional_commission_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE, -- If NULL, applies to all services (Global Rule)
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')), -- 'percentage' or 'fixed'
    value NUMERIC NOT NULL, -- The percentage (e.g., 50.0) or fixed value (e.g., 100.0)
    calculation_basis TEXT DEFAULT 'gross' CHECK (calculation_basis IN ('gross', 'net')), -- 'gross' (Total) or 'net' (Profit)
    CONSTRAINT unique_professional_service UNIQUE NULLS NOT DISTINCT (professional_id, service_id)
);

-- RLS
ALTER TABLE professional_commission_rules ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage everything
CREATE POLICY "Admins manage commission rules" ON professional_commission_rules
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role_id IN (SELECT id FROM roles WHERE name = 'admin') -- Adjust based on actual Role Schema
        )
        OR 
        EXISTS (SELECT 1 FROM roles WHERE id = (SELECT role_id FROM profiles WHERE id = auth.uid()) AND name = 'admin') -- Fallback check
    );

-- Policy: Professionals can view their own rules (maybe?)
CREATE POLICY "Professionals view own rules" ON professional_commission_rules
    FOR SELECT
    TO authenticated
    USING (professional_id = auth.uid());


-- 2. INDEXES
CREATE INDEX IF NOT EXISTS idx_commission_rules_prof ON professional_commission_rules(professional_id);
