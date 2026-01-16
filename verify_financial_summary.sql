SELECT 
    'invoices' as table_name, 
    COUNT(*) as total,
    SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
    SUM(total) as total_amount
FROM invoices
UNION ALL
SELECT 
    'transactions' as table_name,
    COUNT(*) as total,
    SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
    SUM(amount::numeric) as total_amount
FROM transactions
UNION ALL
SELECT 
    'financial_commissions' as table_name,
    COUNT(*) as total,
    SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
    SUM(amount::numeric) as total_amount
FROM financial_commissions;
