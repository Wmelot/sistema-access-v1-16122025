
-- Create Clinical Protocols Table
create table if not exists clinical_protocols (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    region text not null,
    evidence_sources text[] default '{}',
    description text,
    interventions jsonb not null default '[]'::jsonb,
    is_custom boolean default false,
    is_active boolean default true,
    user_id uuid references auth.users(id),
    created_at timestamptz default now()
);

-- Enable RLS
alter table clinical_protocols enable row level security;

-- Policies
-- 1. Everyone can view active system protocols
create policy "View System Protocols"
    on clinical_protocols for select
    using (is_custom = false);

-- 2. Users can view their own custom protocols
create policy "View Own Protocols"
    on clinical_protocols for select
    using (auth.uid() = user_id);

-- 3. Users can insert their own protocols
create policy "Insert Own Protocols"
    on clinical_protocols for insert
    with check (auth.uid() = user_id);

-- 4. Users can update their own protocols
create policy "Update Own Protocols"
    on clinical_protocols for update
    using (auth.uid() = user_id);

-- 5. Users can update 'is_active' on system protocols (Personalization override? No, complex. For now, SYSTEM protocols are read-only for users, they can clone them if needed. Or we create a separate "preferences" table. Let's keep it simple: System protocols are public. Custom are private.)
-- [Correction]: The user wants to "Retirar artigos". This implies Hiding them.
-- To allow Hiding System Protocols, we either need a M2M table `user_protocol_visibility` OR we copy system protocols to user space.
-- Let's go with: System protocols are globally visible. To "Removing" them from *their* view, we need a preference.
-- MVP approach: We'll stick to View Only for System. If they want to "Remove", they can just not use it.
-- BUT, if they want to Add/Remove articles...
-- Let's allow Updating System Protocols? No, that affects everyone.
-- Only Admins/Masters should update System Protocols.
-- Regular users create Custom ones.

-- Seed Data (The 3 existing protocols)
insert into clinical_protocols (title, region, evidence_sources, description, interventions, is_custom, is_active)
values 
(
    'Dor Lombar Crônica (Não Específica)',
    'Coluna Lombar',
    ARRAY['JOSPT CPG 2021/2024', 'NICE Guideline NG59', 'Cochrane Review 2024 (Exercise)'],
    'Condição multifatorial. O foco deve ser a retomada da função e redução do comportamento de medo-evitação. Repouso é contraindicado.',
    '[
      {
        "categoria": "Exercício Terapêutico",
        "nivel_evidencia": "Nível A (Forte)",
        "tipo": "Controle Motor e Fortalecimento Geral",
        "descricao": "Exercícios focados em musculatura do tronco (Core) e fortalecimento global (Cadeia Posterior).",
        "conduta_sugerida": "1. Ativação de Transverso/Multifídeos. 2. Progressão para pranchas e pontes. 3. Deadlift adaptado (carga progressiva).",
        "dosagem": {
          "frequencia": "2 a 3x por semana",
          "volume": "3 séries de 10-15 reps (ou falha técnica)",
          "progressao": "Aumentar carga ou complexidade a cada 2 semanas."
        },
        "prognostico": "Redução clinicamente importante da dor e incapacidade esperada entre 6 a 12 semanas."
      },
      {
        "categoria": "Educação em Dor",
        "nivel_evidencia": "Nível A (Forte)",
        "tipo": "Pain Neuroscience Education (PNE)",
        "descricao": "Reconceituação da dor, desvinculando ''dor'' de ''lesão tecidual''.",
        "conduta_sugerida": "Utilizar metáforas explicativas. Evitar termos nocebos como ''desgaste'', ''osso com osso'' ou ''vértebra fora do lugar''.",
        "dosagem": {
          "frequencia": "Integrado em todas as sessões"
        }
      },
      {
        "categoria": "Terapia Manual",
        "nivel_evidencia": "Nível B (Moderado)",
        "tipo": "Mobilização Articular / Manipulação (Thrust)",
        "descricao": "Técnicas de baixa e alta velocidade para modulação de sintomas.",
        "conduta_sugerida": "Utilizar APENAS como coadjuvante para abrir ''janela terapêutica'' e facilitar o exercício. Não usar como tratamento isolado.",
        "dosagem": {
          "tempo_sessao": "Máximo 10-15 min",
          "duracao_tratamento": "Fase inicial (primeiras 2-4 semanas)"
        }
      }
    ]'::jsonb,
    false,
    true
),
(
    'Cervicalgia Mecânica',
    'Coluna Cervical',
    ARRAY['JOSPT CPG Neck Pain Revision 2017', 'Cochrane 2024'],
    'Dor localizada com restrição de ADM. Responde bem à abordagem multimodal.',
    '[
      {
        "categoria": "Terapia Manual",
        "nivel_evidencia": "Nível B (Moderado/Forte)",
        "tipo": "Mobilização Cervical e Manipulação Torácica",
        "descricao": "Mobilizações PA centrais/unilaterais cervicais e Thrust torácico.",
        "conduta_sugerida": "Manipulação torácica superior provou reduzir dor cervical mecânica imediatamente.",
        "dosagem": {
          "frequencia": "1-2x semana nas fases agudas",
          "tecnicas": "Maitland (Graus III e IV) ou Mulligan (SNAGs)"
        }
      },
      {
        "categoria": "Exercício Terapêutico",
        "nivel_evidencia": "Nível A (Forte)",
        "tipo": "Fortalecimento Cervico-Escapular",
        "descricao": "Foco em flexores profundos do pescoço e estabilizadores escapulares.",
        "conduta_sugerida": "1. Flexão craniocervical. 2. Remadas e abdução horizontal com elástico.",
        "dosagem": {
          "frequencia": "Diária (exercícios domiciliares) + 2x supervisionado",
          "volume": "Séries longas (Resistência): 3x15-20"
        }
      }
    ]'::jsonb,
    false,
    true
),
(
    'Osteoartrose de Joelho',
    'Joelho',
    ARRAY['OARSI Guidelines 2019/2024', 'BMJ 2025 Network Meta-analysis'],
    'Doença articular degenerativa. Primeira linha de tratamento é NÃO-CIRÚRGICA e baseada em exercício + perda de peso.',
    '[
      {
        "categoria": "Exercício Terapêutico",
        "nivel_evidencia": "Nível A (Ouro)",
        "tipo": "Fortalecimento de Quadríceps e Aeróbico",
        "descricao": "Melhora da força muscular periarticular reduz carga articular.",
        "conduta_sugerida": "Cadeia Cinética Aberta (Cadeira Extensora) é segura e eficaz. Agachamentos (ângulo protegido).",
        "dosagem": {
          "frequencia": "3x por semana",
          "intensidade": "Moderada a Vigorosa",
          "duracao": "Programas de no mínimo 8 a 12 semanas."
        }
      },
      {
        "categoria": "Gestão de Peso",
        "nivel_evidencia": "Nível A (Forte)",
        "tipo": "Educação / Encaminhamento",
        "descricao": "Perda de peso reduz drasticamente a carga mecânica no joelho.",
        "conduta_sugerida": "Aconselhamento nutricional ou encaminhamento. Perda de 5% do peso corporal já gera alívio sintomático."
      }
    ]'::jsonb,
    false,
    true
);
