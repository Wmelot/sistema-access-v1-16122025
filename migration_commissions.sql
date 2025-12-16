-- Table to store commission rules per professional
CREATE TABLE IF NOT EXISTS professional_commission_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE, -- NULL means "Default" for all services
    type TEXT CHECK (type IN ('percentage', 'fixed')) NOT NULL DEFAULT 'percentage',
    value NUMERIC(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(professional_id, service_id) -- One rule per service per pro
);

-- Table to store the calculated commission for each appointment
CREATE TABLE IF NOT EXISTS financial_commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    professional_id UUID NOT NULL REFERENCES professionals(id),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status TEXT CHECK (status IN ('pending', 'paid', 'cancelled')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_commissions_professional ON financial_commissions(professional_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON financial_commissions(status);
