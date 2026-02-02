SELECT count(*) as legacy_count FROM patients WHERE name = 'Legacy Patient from Dump';
SELECT count(*) as total_patients FROM patients;
SELECT count(*) as total_appts FROM appointments;
SELECT count(*) as total_invoices FROM invoices;
SELECT count(*) as total_messages FROM message_templates;
