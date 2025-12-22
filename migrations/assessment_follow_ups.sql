-- Migration: Create assessment_follow_ups table
-- Description: Allows scheduling follow-up assessments to be sent to patients

CREATE TABLE IF NOT EXISTS assessment_follow_ups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES form_templates(id) ON DELETE CASCADE,
  original_assessment_id TEXT, -- Store as text since assessments table structure varies
  scheduled_for TIMESTAMPTZ NOT NULL,
  custom_message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'completed')),
  link_token UUID DEFAULT uuid_generate_v4(),
  link_expires_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_follow_ups_patient ON assessment_follow_ups(patient_id);
CREATE INDEX idx_follow_ups_status ON assessment_follow_ups(status);
CREATE INDEX idx_follow_ups_scheduled ON assessment_follow_ups(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_follow_ups_token ON assessment_follow_ups(link_token);

-- RLS Policies
ALTER TABLE assessment_follow_ups ENABLE ROW LEVEL SECURITY;

-- Users can view follow-ups for their organization's patients
CREATE POLICY "Users can view follow-ups for their patients"
  ON assessment_follow_ups FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM patients 
      WHERE organization_id = (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Users can create follow-ups for their organization's patients
CREATE POLICY "Users can create follow-ups"
  ON assessment_follow_ups FOR INSERT
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients 
      WHERE organization_id = (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Users can update their own follow-ups
CREATE POLICY "Users can update their follow-ups"
  ON assessment_follow_ups FOR UPDATE
  USING (created_by = auth.uid());

-- Users can delete their own follow-ups
CREATE POLICY "Users can delete their follow-ups"
  ON assessment_follow_ups FOR DELETE
  USING (created_by = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_assessment_follow_ups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assessment_follow_ups_updated_at
  BEFORE UPDATE ON assessment_follow_ups
  FOR EACH ROW
  EXECUTE FUNCTION update_assessment_follow_ups_updated_at();
