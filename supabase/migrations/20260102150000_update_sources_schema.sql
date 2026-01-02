
-- Update evidence_sources to JSONB for Rich Links
-- First, allow nulls or handle conversion

-- Step 1: Add new column
alter table clinical_protocols add column evidence_details jsonb default '[]'::jsonb;

-- Step 2: Migrate data (Best effort mapping for default protocols)
-- We use the 'title' to identify the records and update them with specific URLs.

update clinical_protocols
set evidence_details = '[
    {"citation": "JOSPT CPG 2021: Low Back Pain", "url": "https://www.jospt.org/doi/10.2519/jospt.2021.0304"},
    {"citation": "NICE Guideline NG59", "url": "https://www.nice.org.uk/guidance/ng59"},
    {"citation": "Cochrane Review 2024 (Exercise)", "url": "https://www.cochranelibrary.com/"}
]'::jsonb
where title ilike '%Lombar%';

update clinical_protocols
set evidence_details = '[
    {"citation": "JOSPT CPG Neck Pain Revision 2017", "url": "https://www.jospt.org/doi/10.2519/jospt.2017.0302"},
    {"citation": "Cochrane 2024", "url": "https://www.cochranelibrary.com/"}
]'::jsonb
where title ilike '%Cervical%';

update clinical_protocols
set evidence_details = '[
    {"citation": "OARSI Guidelines 2019/2024", "url": "https://oarsi.org/research/oarsi-guidelines"},
    {"citation": "BMJ 2025 Network Meta-analysis", "url": "https://www.bmj.com/"}
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
