-- Create payment_method_fees table
CREATE TABLE IF NOT EXISTS payment_method_fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    method VARCHAR(50) NOT NULL, -- 'pix', 'debit_card', 'credit_card'
    installments INT DEFAULT 1,
    fee_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed initial data (prevent duplicates by checking existence)
-- Pix
INSERT INTO payment_method_fees (method, installments, fee_percent)
SELECT 'pix', 1, 0
WHERE NOT EXISTS (SELECT 1 FROM payment_method_fees WHERE method = 'pix');

-- Debit Card
INSERT INTO payment_method_fees (method, installments, fee_percent)
SELECT 'debit_card', 1, 1.37
WHERE NOT EXISTS (SELECT 1 FROM payment_method_fees WHERE method = 'debit_card');

-- Credit Card (1x to 12x)
INSERT INTO payment_method_fees (method, installments, fee_percent)
SELECT 'credit_card', 1, 3.15 WHERE NOT EXISTS (SELECT 1 FROM payment_method_fees WHERE method = 'credit_card' AND installments = 1);

INSERT INTO payment_method_fees (method, installments, fee_percent)
SELECT 'credit_card', 2, 5.39 WHERE NOT EXISTS (SELECT 1 FROM payment_method_fees WHERE method = 'credit_card' AND installments = 2);

INSERT INTO payment_method_fees (method, installments, fee_percent)
SELECT 'credit_card', 3, 6.12 WHERE NOT EXISTS (SELECT 1 FROM payment_method_fees WHERE method = 'credit_card' AND installments = 3);

INSERT INTO payment_method_fees (method, installments, fee_percent)
SELECT 'credit_card', 4, 6.85 WHERE NOT EXISTS (SELECT 1 FROM payment_method_fees WHERE method = 'credit_card' AND installments = 4);

INSERT INTO payment_method_fees (method, installments, fee_percent)
SELECT 'credit_card', 5, 7.57 WHERE NOT EXISTS (SELECT 1 FROM payment_method_fees WHERE method = 'credit_card' AND installments = 5);

INSERT INTO payment_method_fees (method, installments, fee_percent)
SELECT 'credit_card', 6, 8.28 WHERE NOT EXISTS (SELECT 1 FROM payment_method_fees WHERE method = 'credit_card' AND installments = 6);

INSERT INTO payment_method_fees (method, installments, fee_percent)
SELECT 'credit_card', 7, 8.99 WHERE NOT EXISTS (SELECT 1 FROM payment_method_fees WHERE method = 'credit_card' AND installments = 7);

INSERT INTO payment_method_fees (method, installments, fee_percent)
SELECT 'credit_card', 8, 9.69 WHERE NOT EXISTS (SELECT 1 FROM payment_method_fees WHERE method = 'credit_card' AND installments = 8);

INSERT INTO payment_method_fees (method, installments, fee_percent)
SELECT 'credit_card', 9, 10.38 WHERE NOT EXISTS (SELECT 1 FROM payment_method_fees WHERE method = 'credit_card' AND installments = 9);

INSERT INTO payment_method_fees (method, installments, fee_percent)
SELECT 'credit_card', 10, 11.06 WHERE NOT EXISTS (SELECT 1 FROM payment_method_fees WHERE method = 'credit_card' AND installments = 10);

INSERT INTO payment_method_fees (method, installments, fee_percent)
SELECT 'credit_card', 11, 11.74 WHERE NOT EXISTS (SELECT 1 FROM payment_method_fees WHERE method = 'credit_card' AND installments = 11);

INSERT INTO payment_method_fees (method, installments, fee_percent)
SELECT 'credit_card', 12, 12.40 WHERE NOT EXISTS (SELECT 1 FROM payment_method_fees WHERE method = 'credit_card' AND installments = 12);
