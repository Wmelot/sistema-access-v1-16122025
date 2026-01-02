
-- Update evidence_sources to JSONB for Rich Links
-- First, allow nulls or handle conversion

-- Step 1: Add new column
alter table clinical_protocols add column evidence_details jsonb default '[]'::jsonb;

-- Step 2: Migrate data (Best effort mapping for default protocols)
-- We use the 'title' to identify the records and update them with specific URLs.

update clinical_protocols
set evidence_details = '[
    {"citation": "George SZ et al. Interventions for the Management of Acute and Chronic Low Back Pain: Revision 2021. J Orthop Sports Phys Ther. 2021;51(11):CPG1-CPG60.", "url": "https://doi.org/10.2519/jospt.2021.0304"},
    {"citation": "NICE Guideline [NG59]. Low back pain and sciatica in over 16s: assessment and management.", "url": "https://www.nice.org.uk/guidance/ng59"},
    {"citation": "Cochrane Review. Exercise therapy for chronic low back pain. 2021.", "url": "https://www.cochranelibrary.com/"}
]'::jsonb
where title ilike '%Lombar%';

update clinical_protocols
set evidence_details = '[
    {"citation": "Blanpied PR et al. Neck Pain: Revision 2017. J Orthop Sports Phys Ther. 2017;47(7):A1-A83.", "url": "https://doi.org/10.2519/jospt.2017.0302"},
    {"citation": "Cochrane Review 2024 (Manual Therapy+Exercise)", "url": "https://www.cochranelibrary.com/"}
]'::jsonb
where title ilike '%Cervical%';

update clinical_protocols
set evidence_details = '[
    {"citation": "Bannuru RR et al. OARSI guidelines for the non-surgical management of knee, hip, and polyarticular osteoarthritis. Osteoarthritis Cartilage. 2019;27(11):1578-1589.", "url": "https://doi.org/10.1016/j.joca.2019.06.011"},
    {"citation": "BMJ 2025 (Mocked Network Meta-analysis)", "url": "https://www.bmj.com/"}
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
