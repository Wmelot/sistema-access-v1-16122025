
SELECT 'patients' as table, organization_id, count(*) FROM patients GROUP BY organization_id
UNION ALL
SELECT 'appointments' as table, organization_id, count(*) FROM appointments GROUP BY organization_id
UNION ALL
SELECT 'transactions' as table, organization_id, count(*) FROM transactions GROUP BY organization_id
UNION ALL
SELECT 'message_templates' as table, organization_id, count(*) FROM message_templates GROUP BY organization_id;
