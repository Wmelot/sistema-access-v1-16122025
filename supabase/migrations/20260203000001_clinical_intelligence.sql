-- 20260203000000_clinical_evolution_update.sql

-- Add Clinical Intelligence columns to Exercises
ALTER TABLE public.exercises 
ADD COLUMN IF NOT EXISTS tier INT DEFAULT 1 CHECK (tier BETWEEN 1 AND 4),
ADD COLUMN IF NOT EXISTS contraction_type TEXT DEFAULT 'isotonic'; -- isometric, isotonic, plyometric

-- Update Seed Data with Tiers (Examples based on user spec)

-- Level 1 (Baixa Carga/Estável)
UPDATE public.exercises SET tier = 1, contraction_type = 'isotonic' WHERE name = 'Ponte (Bridge)';
UPDATE public.exercises SET tier = 1, contraction_type = 'isometric' WHERE name = 'Perdigueiro'; -- Stability

-- Level 2 (Carga Média/CCF)
UPDATE public.exercises SET tier = 2, contraction_type = 'isotonic' WHERE name = 'Agachamento Livre';
UPDATE public.exercises SET tier = 2, contraction_type = 'isotonic' WHERE name = 'Cadeira Extensora';

-- Level 3 (Alta Demanda/Instável/Unilateral)
UPDATE public.exercises SET tier = 3, contraction_type = 'isotonic' WHERE name = 'Afundo';
UPDATE public.exercises SET tier = 3, contraction_type = 'isotonic' WHERE name = 'Rotação Externa'; -- Usually stability/strength but let's keep it mid tier
UPDATE public.exercises SET tier = 3, contraction_type = 'isotonic' WHERE name = 'Elevação Lateral';

-- Level 4 (Impacto/Balístico)
-- (Adding new exercises if they don't exist for tier 4)
INSERT INTO public.exercises (name, category, is_pilates, equipment, default_load_type, tier, contraction_type)
SELECT 'Salto Vertical', 'Joelho', false, 'Solo', 'rep', 4, 'plyometric'
WHERE NOT EXISTS (SELECT 1 FROM public.exercises WHERE name = 'Salto Vertical');

INSERT INTO public.exercises (name, category, is_pilates, equipment, default_load_type, tier, contraction_type)
SELECT 'Drop Jump', 'Joelho', false, 'Box', 'rep', 4, 'plyometric'
WHERE NOT EXISTS (SELECT 1 FROM public.exercises WHERE name = 'Drop Jump');
