-- ============================================================
-- AXIOM: Portal do Paciente + Diário Miccional
-- Migration: 2026-02-27
-- ============================================================

-- 1. Tokens de acesso ao portal
CREATE TABLE IF NOT EXISTS patient_portal_tokens (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    clinic_id       uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by      uuid REFERENCES profiles(id),
    token           text NOT NULL UNIQUE,
    expires_at      timestamptz,
    permissions     jsonb NOT NULL DEFAULT '{}',
    last_accessed_at timestamptz,
    access_count    int NOT NULL DEFAULT 0,
    is_revoked      boolean NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- Índice para busca rápida por token
CREATE UNIQUE INDEX IF NOT EXISTS idx_portal_tokens_token ON patient_portal_tokens(token);
CREATE INDEX IF NOT EXISTS idx_portal_tokens_patient ON patient_portal_tokens(patient_id);

-- 2. Log de acessos ao portal
CREATE TABLE IF NOT EXISTS portal_access_logs (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id    uuid NOT NULL REFERENCES patient_portal_tokens(id) ON DELETE CASCADE,
    patient_id  uuid NOT NULL,
    accessed_at timestamptz NOT NULL DEFAULT now(),
    ip          text,
    user_agent  text
);

-- 3. Diário Miccional — entradas
CREATE TABLE IF NOT EXISTS voiding_diary_entries (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id    uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    clinic_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    token_id      uuid REFERENCES patient_portal_tokens(id),
    recorded_at   timestamptz NOT NULL DEFAULT now(),

    volume_class  text CHECK (volume_class IN ('little', 'medium', 'much')),
    had_urgency   boolean NOT NULL DEFAULT false,
    had_leakage   boolean NOT NULL DEFAULT false,
    changed_pad   boolean NOT NULL DEFAULT false,

    -- Ingestão de líquidos (opcional)
    liquid_intake text,
    liquid_type   text CHECK (liquid_type IN ('water', 'coffee', 'juice', 'other') OR liquid_type IS NULL),

    notes         text,
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voiding_diary_patient ON voiding_diary_entries(patient_id, recorded_at DESC);

-- ============================================================
-- RLS Policies
-- ============================================================

-- Portal tokens: apenas a própria clínica pode gerenciar
ALTER TABLE patient_portal_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinic_manage_portal_tokens" ON patient_portal_tokens
    USING (clinic_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));

-- Diário: apenas a clínica pode ler
ALTER TABLE voiding_diary_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinic_read_voiding_diary" ON voiding_diary_entries
    USING (clinic_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ));

-- ============================================================
-- Exemplo de token para testes
-- ============================================================
-- INSERT INTO patient_portal_tokens (patient_id, clinic_id, token, permissions, expires_at)
-- VALUES (
--     '...patient-uuid...',
--     '...clinic-uuid...',
--     'axiom-test-token-2026',
--     '{"voiding_diary": {"enabled": true, "duration_days": 3, "expires_at": "2026-03-05T00:00:00Z"}}',
--     '2026-03-10T00:00:00Z'
-- );
