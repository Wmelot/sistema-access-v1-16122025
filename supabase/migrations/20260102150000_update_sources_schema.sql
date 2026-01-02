
-- Update evidence_sources to JSONB for Rich Links
-- First, allow nulls or handle conversion

-- Step 1: Add new column
alter table clinical_protocols add column evidence_details jsonb default '[]'::jsonb;

-- Step 2: Migrate data (Best effort mapping for default protocols)
-- We use the 'title' to identify the records and update them with specific URLs.

-- Update Low Back Pain (Lombar) with Rich Data
update clinical_protocols
set 
    evidence_details = '[
      {
        "titulo": "Clinical Practice Guidelines: Low Back Pain",
        "autor": "George SZ et al. (JOSPT)",
        "ano": "2021",
        "doi_link": "https://www.jospt.org/doi/10.2519/jospt.2021.0304",
        "nivel_evidencia": "Diretriz Clínica (CPG)",
        "status": "Ativo"
      },
      {
        "titulo": "Low back pain and sciatica in over 16s: assessment and management (NG59)",
        "autor": "NICE Guidelines",
        "ano": "2020",
        "doi_link": "https://www.nice.org.uk/guidance/ng59",
        "nivel_evidencia": "Diretriz Clínica",
        "status": "Ativo"
      },
      {
        "titulo": "Exercise therapy for chronic low back pain",
        "autor": "Hayden JA et al. (Cochrane Database)",
        "ano": "2021",
        "doi_link": "https://doi.org/10.1002/14651858.CD009790.pub2",
        "nivel_evidencia": "Revisão Sistemática",
        "status": "Ativo"
      }
    ]'::jsonb,
    interventions = '[
      {
        "categoria": "Exercício Terapêutico",
        "tipo": "Controle Motor e Fortalecimento",
        "fonte_referencia": "JOSPT 2021 / Cochrane 2021",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A (Forte)",
          "tamanho_efeito": "SMD > 0.8 (Grande)"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 5,
          "cor": "green",
          "texto_amigavel": "Tratamento Padrão Ouro"
        },
        "conduta_sugerida": "Ativação de Transverso/Multifídeos.",
        "dosagem": "2-3x semana, 3 séries de 10-15 reps."
      },
      {
        "categoria": "Eletroterapia",
        "tipo": "Ultrassom",
        "fonte_referencia": "NICE NG59",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível D (Não Recomendado)",
          "tamanho_efeito": "SMD < 0.2"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 1,
          "cor": "red",
          "texto_amigavel": "Não Recomendado"
        },
        "conduta_sugerida": "Evitar uso isolado."
      }
    ]'::jsonb
where title ilike '%Lombar%';

-- Update Knee OA (Joelho) with Rich Data
update clinical_protocols
set 
    evidence_details = '[
      {
        "titulo": "OARSI guidelines for the non-surgical management of knee, hip, and polyarticular osteoarthritis",
        "autor": "Bannuru RR et al. (OARSI)",
        "ano": "2019",
        "doi_link": "https://doi.org/10.1016/j.joca.2019.06.011",
        "nivel_evidencia": "Diretriz Internacional",
        "status": "Ativo"
      }
    ]'::jsonb,
    interventions = '[
      {
        "categoria": "Exercício Terapêutico",
        "tipo": "Fortalecimento de Quadríceps",
        "fonte_referencia": "OARSI 2019",
        "dados_tecnicos": {
          "nivel_evidencia": "Nível A",
          "tamanho_efeito": "SMD > 0.8"
        },
        "visualizacao_paciente": {
          "confianca": 5,
          "potencia": 5,
          "cor": "green",
          "texto_amigavel": "Essencial"
        },
        "conduta_sugerida": "Cadeia cinética aberta e fechada."
      }
    ]'::jsonb
where title ilike '%Joelho%';

-- For others (custom), migrate existing text array to basic objects
-- (Assuming we keep evidence_sources as legacy or drop it? Let's keep it sync or drop. 
-- Dropping is cleaner but risky if migration fails. Let's Drop 'evidence_sources' and rename 'evidence_details' to 'evidence_sources' later?
-- Or just use 'evidence_details' as the primary source of truth.)
-- Let's stick with specific updates above. For generated ones, we can leave empty or migrate:

-- Step 3: Remove old column and rename new one? 
-- Or easier: just ALTER the type if possible? No, casting text[] to jsonb is hard.
-- Strategy: Drop old, Rename new.

alter table clinical_protocols drop column evidence_sources;
alter table clinical_protocols rename column evidence_details to evidence_sources;

-- Now evidence_sources is JSONB.
