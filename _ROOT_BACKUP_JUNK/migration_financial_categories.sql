CREATE TABLE IF NOT EXISTS financial_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    type TEXT CHECK (type IN ('income', 'expense', 'both')) DEFAULT 'both',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert defaults
INSERT INTO financial_categories (name, type) VALUES
('Sistema', 'expense'),
('INSS GPS', 'expense'),
('CEMIG', 'expense'),
('Internet', 'expense'),
('Contabilidade', 'expense'),
('Aluguel', 'expense'),
('Materiais', 'expense'),
('Marketing', 'expense'),
('Impostos', 'expense'),
('Venda', 'income'),
('Serviço', 'income'),
('Outros', 'both')
ON CONFLICT (name) DO NOTHING;
