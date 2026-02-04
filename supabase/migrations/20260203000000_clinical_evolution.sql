-- 1. Tabela Mestra de Exercícios (Híbrida: Clínica + Pilates)
create table if not exists public.exercises (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  name text not null,
  category text not null, -- Ex: 'Joelho', 'Coluna', 'Ombro'
  is_pilates boolean default false, -- Se true, aparece no módulo Pilates
  equipment text, -- Ex: 'Reformer', 'Cadillac', 'Elástico', 'Halter'
  default_load_type text default 'kg' -- 'kg', 'mola', 'cor', 'tempo'
);

-- 2. Tabela de Itens da Evolução (Onde salvamos o treino do dia)
create table if not exists public.attendance_exercises (
  id uuid default gen_random_uuid() primary key,
  -- CORREÇÃO: Referência deve ser APPOINTMENTS ou PATIENT_RECORDS, pois 'attendances' não existe.
  -- Usaremos appointments (agendamento) como o 'atendimento' pai.
  -- Note: Se você usa 'patient_records', altere para references public.patient_records(id)
  attendance_id uuid references public.appointments(id) on delete cascade, 
  exercise_id uuid references public.exercises(id),
  
  -- Prescrição
  sets int, -- Séries
  reps int, -- Repetições
  load_value text, -- Carga (ex: '10kg', 'Azul', 'Mola Vermelha')
  duration_seconds int, -- Para isometria
  observation text, -- Obs específica do exercício
  
  -- Monitoramento de Carga e Dor
  pain_during int check (pain_during between 0 and 10), -- Dor durante (0-10)
  pain_after int check (pain_after between 0 and 10), -- Dor logo após (0-10)
  pain_next_morning int check (pain_next_morning between 0 and 10), -- Dor manhã seguinte
  rpe int check (rpe between 0 and 10), -- Percepção de Esforço (Borg Adaptada)
  
  -- Sugestão da IA para a próxima vez
  ia_suggestion text -- Ex: "Aumentar carga para 12kg"
);

-- 3. Inserção dos Exercícios (Seed Inicial - Top 15 + Pilates Básico) - Com verificação para não duplicar
INSERT INTO public.exercises (name, category, is_pilates, equipment, default_load_type)
SELECT 'Agachamento Livre', 'Joelho', false, 'Peso Livre', 'kg'
WHERE NOT EXISTS (SELECT 1 FROM public.exercises WHERE name = 'Agachamento Livre');

INSERT INTO public.exercises (name, category, is_pilates, equipment, default_load_type)
SELECT 'Cadeira Extensora', 'Joelho', false, 'Máquina', 'kg'
WHERE NOT EXISTS (SELECT 1 FROM public.exercises WHERE name = 'Cadeira Extensora');

INSERT INTO public.exercises (name, category, is_pilates, equipment, default_load_type)
SELECT 'Afundo', 'Joelho', false, 'Peso Livre', 'kg'
WHERE NOT EXISTS (SELECT 1 FROM public.exercises WHERE name = 'Afundo');

INSERT INTO public.exercises (name, category, is_pilates, equipment, default_load_type)
SELECT 'Rotação Externa', 'Ombro', false, 'Elástico', 'cor'
WHERE NOT EXISTS (SELECT 1 FROM public.exercises WHERE name = 'Rotação Externa');

INSERT INTO public.exercises (name, category, is_pilates, equipment, default_load_type)
SELECT 'Elevação Lateral', 'Ombro', false, 'Halter', 'kg'
WHERE NOT EXISTS (SELECT 1 FROM public.exercises WHERE name = 'Elevação Lateral');

INSERT INTO public.exercises (name, category, is_pilates, equipment, default_load_type)
SELECT 'Ponte (Bridge)', 'Lombar', false, 'Solo', 'rep'
WHERE NOT EXISTS (SELECT 1 FROM public.exercises WHERE name = 'Ponte (Bridge)');

INSERT INTO public.exercises (name, category, is_pilates, equipment, default_load_type)
SELECT 'Perdigueiro', 'Lombar', false, 'Solo', 'tempo'
WHERE NOT EXISTS (SELECT 1 FROM public.exercises WHERE name = 'Perdigueiro');

INSERT INTO public.exercises (name, category, is_pilates, equipment, default_load_type)
SELECT 'Footwork', 'Membros Inferiores', true, 'Reformer', 'mola'
WHERE NOT EXISTS (SELECT 1 FROM public.exercises WHERE name = 'Footwork');

INSERT INTO public.exercises (name, category, is_pilates, equipment, default_load_type)
SELECT 'Mermaid', 'Coluna', true, 'Reformer', 'mola'
WHERE NOT EXISTS (SELECT 1 FROM public.exercises WHERE name = 'Mermaid');

INSERT INTO public.exercises (name, category, is_pilates, equipment, default_load_type)
SELECT 'The Hundred', 'Abdominais', true, 'Mat', 'tempo'
WHERE NOT EXISTS (SELECT 1 FROM public.exercises WHERE name = 'The Hundred');
