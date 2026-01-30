-- Verificar se a Access Fisioterapia tem endereço cadastrado
SELECT 
    o.id,
    o.name,
    o.slug,
    cs.address
FROM organizations o
LEFT JOIN clinic_settings cs ON cs.id = o.id
WHERE o.slug = 'access-fisioterapia';
