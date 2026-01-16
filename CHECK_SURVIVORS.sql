
-- CHECK SURVIVORS (Busca por tabelas renomeadas)
-- A tabela 'assessments' sumiu, mas talvez ela tenha virado 'patient_assessments'.

SELECT 
    to_regclass('public.patient_assessments') as has_patient_assessments,
    to_regclass('public.clinical_records') as has_clinical_records,
    to_regclass('public.reminders') as has_reminders,
    to_regclass('public.organizations') as has_organizations;

-- Se 'patient_assessments' existir, vamos contar quantos registros tem nela
SELECT count(*) FROM public.patient_assessments;
