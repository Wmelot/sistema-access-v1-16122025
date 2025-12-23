-- Create patient_assessments table for storing questionnaire responses
CREATE TABLE IF NOT EXISTS patient_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    professional_id UUID REFERENCES profiles(id),
    type TEXT NOT NULL,
    template_id TEXT,
    title TEXT,
    data JSONB NOT NULL DEFAULT '{}',
    scores JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_patient_assessments_patient_id ON patient_assessments(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_assessments_template_id ON patient_assessments(template_id);
CREATE INDEX IF NOT EXISTS idx_patient_assessments_created_at ON patient_assessments(created_at DESC);

-- Enable RLS
ALTER TABLE patient_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view assessments from their organization"
    ON patient_assessments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM patients p
            JOIN profiles prof ON prof.organization_id = p.organization_id
            WHERE p.id = patient_assessments.patient_id
            AND prof.id = auth.uid()
        )
    );

CREATE POLICY "Users can create assessments for patients in their organization"
    ON patient_assessments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM patients p
            JOIN profiles prof ON prof.organization_id = p.organization_id
            WHERE p.id = patient_assessments.patient_id
            AND prof.id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own assessments"
    ON patient_assessments FOR UPDATE
    USING (professional_id = auth.uid());

CREATE POLICY "Users can delete their own assessments"
    ON patient_assessments FOR DELETE
    USING (professional_id = auth.uid());

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_patient_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_patient_assessments_updated_at
    BEFORE UPDATE ON patient_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_patient_assessments_updated_at();
