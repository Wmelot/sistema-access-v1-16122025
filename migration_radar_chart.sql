-- Create Form Metrics Table (Stores calculation rules)
CREATE TABLE IF NOT EXISTS form_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL, -- e.g., "Índice de Função", "Nível de Dor"
    description TEXT,
    target_min DECIMAL DEFAULT 0,
    target_max DECIMAL DEFAULT 10,
    
    -- logic: JSON defining the calculation
    -- {
    --   "type": "average", // or "sum", "weighted"
    --   "sources": [
    --      { "field_id": "field_123", "weight": 1.0, "max_value": 5 },
    --      { "field_id": "field_456", "weight": 2.0, "max_value": 10 }
    --   ]
    -- }
    calculation_rule JSONB NOT NULL DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Chart Templates Table (Stores chart configurations)
CREATE TABLE IF NOT EXISTS chart_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL, -- e.g., "Gráfico de Avaliação Física"
    type TEXT DEFAULT 'radar', -- 'radar', 'bar', 'line'
    
    -- config: JSON defining axes
    -- {
    --   "axes": [
    --     { "metric_id": "uuid-of-funcao", "label": "Função" },
    --     { "metric_id": "uuid-of-dor", "label": "Dor" }
    --   ]
    -- }
    config JSONB NOT NULL DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE form_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_templates ENABLE ROW LEVEL SECURITY;

-- Policies for form_metrics
CREATE POLICY "Metrics are viewable by authenticated users" ON form_metrics
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Metrics are insertable by authenticated users" ON form_metrics
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Metrics are updatable by authenticated users" ON form_metrics
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Metrics are deletable by authenticated users" ON form_metrics
    FOR DELETE USING (auth.role() = 'authenticated');

-- Policies for chart_templates
CREATE POLICY "Charts are viewable by authenticated users" ON chart_templates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Charts are insertable by authenticated users" ON chart_templates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Charts are updatable by authenticated users" ON chart_templates
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Charts are deletable by authenticated users" ON chart_templates
    FOR DELETE USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON form_metrics TO authenticated;
GRANT ALL ON chart_templates TO authenticated;
GRANT ALL ON form_metrics TO service_role;
GRANT ALL ON chart_templates TO service_role;
