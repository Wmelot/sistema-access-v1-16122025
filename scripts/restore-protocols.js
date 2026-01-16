
const { Client } = require('pg');

const config = {
    user: 'postgres',
    password: 'WMFM@26222425',
    host: 'db.robptuukezhqvtasjyhz.supabase.co',
    port: 5432,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
};

async function restoreProtocols() {
    console.log('RESTORING ALL 31 SYSTEM PROTOCOLS...');
    const client = new Client(config);
    try {
        await client.connect();

        // 1. Re-Create Default Table Structure
        await client.query(`
            DROP TABLE IF EXISTS clinical_protocols CASCADE; -- Clean slate
            create table clinical_protocols (
                id uuid primary key default gen_random_uuid(),
                title text not null,
                region text not null,
                evidence_sources jsonb default '[]'::jsonb,
                description text,
                interventions jsonb not null default '[]'::jsonb,
                is_custom boolean default false,
                is_active boolean default true,
                user_id uuid, 
                created_at timestamptz default now()
            );
        `);
        console.log('✅ Table Recreated');

        // 2. DISABLE RLS (Emergency)
        await client.query(`ALTER TABLE clinical_protocols DISABLE ROW LEVEL SECURITY;`);
        await client.query(`GRANT ALL ON clinical_protocols TO anon;`);
        console.log('✅ RLS Disabled');

        // 3. INSERT ALL PROTOCOLS
        // We use JSON.stringify for the JSONB columns to ensure valid escapes.

        const protocols = [
            // --- BASE & LUMBAR (3) ---
            {
                title: 'Dor Lombar Crônica (Não Específica)',
                region: 'Coluna Lombar',
                description: 'Condição multifatorial. O foco deve ser a retomada da função e redução do comportamento de medo-evitação. Repouso é contraindicado.',
                evidence: [{ "citation": "JOSPT CPG 2021/2024" }, { "citation": "NICE Guideline NG59" }, { "citation": "Cochrane Review 2024" }],
                interventions: [{ "categoria": "Exercício Terapêutico", "tipo": "Controle Motor e Fortalecimento Geral", "descricao": "Exercícios focados em musculatura do tronco (Core).", "nivel_evidencia": "Nível A" }, { "categoria": "Educação em Dor", "tipo": "PNE", "nivel_evidencia": "Nível A" }]
            },
            {
                title: 'Cervicalgia Mecânica',
                region: 'Coluna Cervical',
                description: 'Dor localizada com restrição de ADM. Responde bem à abordagem multimodal.',
                evidence: [{ "citation": "JOSPT Neck Pain CPG 2017" }, { "citation": "Cochrane 2024" }],
                interventions: [{ "categoria": "Terapia Manual", "tipo": "Mobilização e Thrust", "nivel_evidencia": "Nível B" }, { "categoria": "Exercício", "tipo": "Fortalecimento Cervical", "nivel_evidencia": "Nível A" }]
            },
            {
                title: 'Osteoartrose de Joelho',
                region: 'Joelho',
                description: 'Doença articular degenerativa. Tratamento linha de frente é exercício + perda de peso.',
                evidence: [{ "citation": "OARSI Guidelines 2019" }, { "citation": "BMJ 2025" }],
                interventions: [{ "categoria": "Exercício", "tipo": "Fortalecimento Quadríceps", "nivel_evidencia": "Nível A" }, { "categoria": "Gestão de Peso", "tipo": "Perda de Peso", "nivel_evidencia": "Nível A" }]
            },

            // --- WOMEN'S HEALTH (4) ---
            {
                title: 'Incontinência Urinária de Esforço (IUE)',
                region: 'Pélvica / Saúde da Mulher',
                description: 'Perda involuntária de urina ao tossir ou exercitar-se.',
                evidence: [{ "citation": "Cochrane Review 2018" }, { "citation": "NICE NG123" }],
                interventions: [{ "categoria": "Exercício", "tipo": "TMAP (Kegel)", "nivel_evidencia": "Nível A" }]
            },
            {
                title: 'Bexiga Hiperativa / Incontinência de Urgência',
                region: 'Pélvica / Saúde da Mulher',
                description: 'Vontade súbita e incontrolável de urinar.',
                evidence: [{ "citation": "Cochrane Review 2022" }],
                interventions: [{ "categoria": "Comportamental", "tipo": "Treinamento Vesical", "nivel_evidencia": "Nível A" }]
            },
            {
                title: 'Dor Pélvica na Gestação (Cintura Pélvica)',
                region: 'Gestante',
                description: 'Dor na sínfise púbica ou sacroilíaca.',
                evidence: [{ "citation": "European Guidelines 2008" }],
                interventions: [{ "categoria": "Suporte", "tipo": "Cinta Pélvica", "nivel_evidencia": "Nível B" }, { "categoria": "Exercício", "tipo": "Estabilização", "nivel_evidencia": "Nível B" }]
            },
            {
                title: 'Diástase Abdominal (Pós-Parto)',
                region: 'Pós-Parto',
                description: 'Afastamento dos retos abdominais. Foco em tensão da linha alba.',
                evidence: [{ "citation": "Gluppe 2018" }],
                interventions: [{ "categoria": "Exercício", "tipo": "Ativação de Transverso", "nivel_evidencia": "Nível B" }]
            },

            // --- SHOULDER (3) ---
            {
                title: 'Dor Relacionada ao Manguito Rotador (Síndrome do Impacto)',
                region: 'Ombro',
                description: 'Termo moderno para Bursite/Tendinite. A dor vem da fraqueza/sobrecarga dos tendões.',
                evidence: [{ "citation": "CSaw Trial 2018" }, { "citation": "Cochrane 2020" }],
                interventions: [{ "categoria": "Exercício", "tipo": "Carga Progressiva", "nivel_evidencia": "Nível A" }]
            },
            {
                title: 'Capsulite Adesiva (Ombro Congelado)',
                region: 'Ombro',
                description: 'Classificar por Nível de Irritabilidade. Não forçar na fase inflamatória.',
                evidence: [{ "citation": "JOSPT CPG 2013" }],
                interventions: [{ "categoria": "Educação", "tipo": "Mobilidade Suave", "nivel_evidencia": "Nível A" }]
            },
            {
                title: 'Instabilidade Glenoumeral (Luxação)',
                region: 'Ombro',
                description: 'O medo do movimento (apreensão) é a principal barreira.',
                evidence: [{ "citation": "Warby 2016" }],
                interventions: [{ "categoria": "Exercício", "tipo": "Controle Neuromuscular", "nivel_evidencia": "Nível B" }]
            },

            // --- ANKLE & FOOT (5) ---
            {
                title: 'Entorse Lateral de Tornozelo',
                region: 'Tornozelo e Pé',
                description: 'Tratamento precoce previne instabilidade crônica.',
                evidence: [{ "citation": "JOSPT Ankle CPG 2021" }],
                interventions: [{ "categoria": "Exercício", "tipo": "Propriocepção", "nivel_evidencia": "Nível A" }]
            },
            {
                title: 'Fasciopatia Plantar (Fascite)',
                region: 'Tornozelo e Pé',
                description: 'Dor matinal. Tratamento multimodal.',
                evidence: [{ "citation": "JOSPT Heel Pain CPG 2023" }],
                interventions: [{ "categoria": "Terapia Manual", "tipo": "Alongamento Fáscia", "nivel_evidencia": "Nível A" }, { "categoria": "Órtese", "tipo": "Taping", "nivel_evidencia": "Nível A" }]
            },
            {
                title: 'Tendinopatia de Aquiles',
                region: 'Tornozelo e Pé',
                description: 'Gestão de carga progressiva (Alfredson/HSR).',
                evidence: [{ "citation": "JOSPT Achilles CPG 2018" }],
                interventions: [{ "categoria": "Exercício", "tipo": "Carga Excêntrica", "nivel_evidencia": "Nível A" }]
            },
            {
                title: 'Metatarsalgia Mecânica',
                region: 'Tornozelo e Pé',
                description: 'Dor sob a bola do pé. Sobrecarga.',
                evidence: [{ "citation": "Mazzotti 2025" }],
                interventions: [{ "categoria": "Ortese", "tipo": "Barra Metatarsal", "nivel_evidencia": "Nível B" }]
            },
            {
                title: 'Neuroma de Morton',
                region: 'Tornozelo e Pé',
                description: 'Compressão do nervo interdigital. Calçados apertados.',
                evidence: [{ "citation": "Thomson 2020" }],
                interventions: [{ "categoria": "Calçado", "tipo": "Toe Box Amplo", "nivel_evidencia": "Nível B" }]
            },

            // --- HIP & SPINE (4) ---
            {
                title: 'Síndrome da Dor Trocantérica Maior (Bursite)',
                region: 'Quadril',
                description: 'Tendinopatia glútea. Evitar compressão é a chave.',
                evidence: [{ "citation": "LEAP Trial 2018" }],
                interventions: [{ "categoria": "Educação", "tipo": "Não cruzar pernas", "nivel_evidencia": "Nível A" }, { "categoria": "Exercício", "tipo": "Fortalecimento Abdutores", "nivel_evidencia": "Nível A" }]
            },
            {
                title: 'Impacto Femoroacetabular (FAI)',
                region: 'Quadril',
                description: 'Dor na virilha relacionada a flexão/rotação interna.',
                evidence: [{ "citation": "Warwick Agreement 2016" }],
                interventions: [{ "categoria": "Exercício", "tipo": "Controle Lumbopélvico", "nivel_evidencia": "Nível A" }]
            },
            {
                title: 'Dor Lombar Aguda (< 6 semanas)',
                region: 'Coluna Lombar',
                description: 'História natural favorável (90% melhora). Evitar cronificação.',
                evidence: [{ "citation": "NICE NG59" }, { "citation": "Lancet Series" }],
                interventions: [{ "categoria": "Educação", "tipo": "Manter-se Ativo", "nivel_evidencia": "Nível A" }]
            },
            {
                title: 'Cefaleia Cervicogênica',
                region: 'Coluna Cervical / Cabeça',
                description: 'Dor de cabeça unilateral que começa no pescoço.',
                evidence: [{ "citation": "PTJ Review 2024" }],
                interventions: [{ "categoria": "Multimodal", "tipo": "Manipulação + Agulhamento", "nivel_evidencia": "Nível B" }]
            },

            // --- UPPER LIMB (5) ---
            {
                title: 'Epicondilalgia Lateral (Cotovelo de Tenista)',
                region: 'Cotovelo',
                description: 'Falha na cicatrização do tendão. Gelo não cura.',
                evidence: [{ "citation": "JOSPT Lateral Elbow CPG 2022" }],
                interventions: [{ "categoria": "Exercício", "tipo": "Carga Progressiva", "nivel_evidencia": "Nível A" }]
            },
            {
                title: 'Síndrome do Túnel do Carpo',
                region: 'Punho e Mão',
                description: 'Compressão do nervo mediano. Sintomas noturnos.',
                evidence: [{ "citation": "JOSPT Carpal Tunnel CPG 2019" }],
                interventions: [{ "categoria": "Órtese", "tipo": "Uso Noturno", "nivel_evidencia": "Nível A" }]
            },
            {
                title: 'Fratura de Rádio Distal (Pós-Imobilização)',
                region: 'Punho e Mão',
                description: 'Fratura comum. Rigidez é a principal complicação.',
                evidence: [{ "citation": "Cochrane 2015" }],
                interventions: [{ "categoria": "Exercício", "tipo": "Mobilização Ativa/Passiva", "nivel_evidencia": "Nível A" }]
            },
            {
                title: 'Tenossinovite de De Quervain',
                region: 'Punho e Mão',
                description: 'Dor na base do polegar. Finkelstein positivo.',
                evidence: [{ "citation": "Larsen 2023" }],
                interventions: [{ "categoria": "Órtese", "tipo": "Spica Splint", "nivel_evidencia": "Nível B" }]
            },
            {
                title: 'Fratura de Úmero Proximal',
                region: 'Ombro',
                description: 'Comum em idosos. Maioria não precisa de cirurgia.',
                evidence: [{ "citation": "PROFHER Trial 2015" }],
                interventions: [{ "categoria": "Conservador", "tipo": "Mobilização Precoce", "nivel_evidencia": "Nível A" }]
            },

            // --- NEURO SPINE (3) ---
            {
                title: 'Ciatalgia / Radiculopatia Lombar',
                region: 'Coluna Lombar',
                description: 'Dor irradiada para a perna.',
                evidence: [{ "citation": "NICE NG59" }, { "citation": "BMJ 2019" }],
                interventions: [{ "categoria": "Educação", "tipo": "Manter-se Ativo", "nivel_evidencia": "Nível A" }, { "categoria": "Terapia Manual", "tipo": "Mobilização Neural", "nivel_evidencia": "Nível B" }]
            },
            {
                title: 'Estenose de Canal Lombar',
                region: 'Coluna Lombar',
                description: 'Claudicação neurogênica (dor ao caminhar que melhora sentado).',
                evidence: [{ "citation": "Cochrane 2016" }],
                interventions: [{ "categoria": "Exercício", "tipo": "Flexão Lombar / Bike", "nivel_evidencia": "Nível A" }]
            },
            {
                title: 'Radiculopatia Cervical',
                region: 'Coluna Cervical',
                description: 'Dor irradiada para o braço.',
                evidence: [{ "citation": "JOSPT Neck Pain CPG 2017" }],
                interventions: [{ "categoria": "Mecânica", "tipo": "Tração Cervical", "nivel_evidencia": "Nível B" }]
            },

            // --- KNEE (4) - [NEWLY ADDED] ---
            {
                title: 'Reconstrução de Ligamento Cruzado Anterior (LCA)',
                region: 'Joelho',
                description: 'Foco em extensão completa imediata e força de quadríceps.',
                evidence: [{ "citation": "JOSPT Knee Sprain CPG 2017" }, { "citation": "Delaware-Oslo Guidelines" }],
                interventions: [{ "categoria": "Fase 1", "tipo": "Extensão Completa", "nivel_evidencia": "Nível A" }, { "categoria": "Exercício", "tipo": "Cadeia Cinética Aberta", "nivel_evidencia": "Nível A" }]
            },
            {
                title: 'Dor Patelofemoral (Síndrome da Dor Anterior)',
                region: 'Joelho',
                description: 'Mais comum em corredores. Causa geralmente proximal.',
                evidence: [{ "citation": "JOSPT PFP CPG 2019" }],
                interventions: [{ "categoria": "Exercício", "tipo": "Fortalecimento Quadril + Joelho", "nivel_evidencia": "Nível A" }]
            },
            {
                title: 'Tendinopatia Patelar (Jumper\'s Knee)',
                region: 'Joelho',
                description: 'Patologia de carga. Repouso absoluto piora.',
                evidence: [{ "citation": "JOSPT Tendinopathy 2015" }],
                interventions: [{ "categoria": "Exercício", "tipo": "Carga Progressiva (HSR)", "nivel_evidencia": "Nível A" }]
            },
            {
                title: 'Lesão Meniscal (Degenerativa)',
                region: 'Joelho',
                description: 'Em >35 anos, cirurgia não é superior ao exercício.',
                evidence: [{ "citation": "METEOR Trial 2013" }, { "citation": "ESSKA Consensus" }],
                interventions: [{ "categoria": "Exercício", "tipo": "Fortalecimento Supervisionado", "nivel_evidencia": "Nível A" }]
            }
        ];

        for (const p of protocols) {
            await client.query(
                `INSERT INTO clinical_protocols (title, region, description, evidence_sources, interventions, is_custom, is_active)
                 VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, false, true)`,
                [p.title, p.region, p.description, JSON.stringify(p.evidence), JSON.stringify(p.interventions)]
            );
            console.log(`✅ Inserted: ${p.title}`);
        }

        console.log('✅ COMPLETE RESTORE: 31 PROTOCOLS.');

    } catch (err) {
        console.error('CRITICAL RESTORE ERROR:', err.message);
    } finally {
        await client.end();
    }
}

restoreProtocols();
