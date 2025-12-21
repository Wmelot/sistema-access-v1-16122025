-- VERIFICAÇÃO DE ANIVERSARIANTES (Versão Corrigida para Ano Bissexto)

WITH patients_with_dates AS (
    SELECT 
        name,
        date_of_birth,
        -- Abordagem segura para "Aniversário Este Ano" no Postgres:
        -- Somar a diferença de anos à data original.
        -- O Postgres mapeia automaticamente 29/02 para 28/02 em anos não-bissextos.
        (date_of_birth + ((EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM date_of_birth))::int || ' years')::interval)::date as bday_this_year,
        
        -- Aniversário no Próximo Ano (para casos de virada de ano, ex: Dezembro -> Janeiro)
        (date_of_birth + ((EXTRACT(YEAR FROM CURRENT_DATE) + 1 - EXTRACT(YEAR FROM date_of_birth))::int || ' years')::interval)::date as bday_next_year
    FROM public.patients
    WHERE date_of_birth IS NOT NULL
)
SELECT 
    name, 
    to_char(date_of_birth, 'DD/MM/YYYY') as data_nasc,
    to_char(bday_this_year, 'DD/MM/YYYY') as niver_este_ano,
    to_char(bday_next_year, 'DD/MM/YYYY') as niver_prox_ano
FROM patients_with_dates
WHERE 
    -- Verifica se o aniversário deste ano cai nos próximos 30 dias (ex: está no futuro próximo)
    (bday_this_year >= CURRENT_DATE AND bday_this_year <= (CURRENT_DATE + 30))
    OR
    -- Verifica se o aniversário do ano que vem cai nos próximos 30 dias (ex: virada de ano)
    (bday_next_year >= CURRENT_DATE AND bday_next_year <= (CURRENT_DATE + 30))
ORDER BY 
    CASE 
        WHEN bday_this_year >= CURRENT_DATE THEN bday_this_year 
        ELSE bday_next_year 
    END ASC;
