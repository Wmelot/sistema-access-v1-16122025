
SELECT 'patients' as table_name, organization_id, count(*) FROM patients GROUP BY organization_id
UNION ALL
SELECT 'appointments' as table_name, organization_id, count(*) FROM appointments GROUP BY organization_id
UNION ALL
SELECT 'transactions' as table_name, organization_id, count(*) FROM transactions GROUP BY organization_id;
