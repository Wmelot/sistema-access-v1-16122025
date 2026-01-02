
export const CLINICAL_PROTOCOLS = [
    {
        "id": "LBP_CHRONIC_01",
        "patologia": "Dor Lombar Crônica (Não Específica)",
        "regiao": "Coluna Lombar",
        "fontes_evidencia": ["JOSPT CPG 2021/2024", "NICE Guideline NG59", "Cochrane Review 2024 (Exercise)"],
        "ultima_atualizacao": "2025-01-02",
        "resumo_clinico": "Condição multifatorial. O foco deve ser a retomada da função e redução do comportamento de medo-evitação. Repouso é contraindicado.",
        "intervencoes": [
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
                "descricao": "Reconceituação da dor, desvinculando 'dor' de 'lesão tecidual'.",
                "conduta_sugerida": "Utilizar metáforas explicativas. Evitar termos nocebos como 'desgaste', 'osso com osso' ou 'vértebra fora do lugar'.",
                "dosagem": {
                    "frequencia": "Integrado em todas as sessões"
                }
            },
            {
                "categoria": "Terapia Manual",
                "nivel_evidencia": "Nível B (Moderado)",
                "tipo": "Mobilização Articular / Manipulação (Thrust)",
                "descricao": "Técnicas de baixa e alta velocidade para modulação de sintomas.",
                "conduta_sugerida": "Utilizar APENAS como coadjuvante para abrir 'janela terapêutica' e facilitar o exercício. Não usar como tratamento isolado.",
                "dosagem": {
                    "tempo_sessao": "Máximo 10-15 min",
                    "duracao_tratamento": "Fase inicial (primeiras 2-4 semanas)"
                }
            },
            {
                "categoria": "Eletroterapia",
                "nivel_evidencia": "Nível D (Não Recomendado)",
                "tipo": "Ultrassom / TENS isolado",
                "descricao": "Modalidades passivas.",
                "conduta_sugerida": "Evitar o uso. Focam no modelo biomédico passivo e podem aumentar a dependência do paciente. TENS apenas se dor > 8/10 impedindo movimento.",
                "dosagem": {
                    "nota": "Uso desencorajado pelas diretrizes atuais (NICE)."
                }
            }
        ]
    },
    {
        "id": "NP_MEC_01",
        "patologia": "Cervicalgia Mecânica (Com Déficit de Mobilidade)",
        "regiao": "Coluna Cervical",
        "fontes_evidencia": ["JOSPT CPG Neck Pain Revision 2017", "Cochrane 2024 (Manual Therapy+Exercise)"],
        "ultima_atualizacao": "2025-01-02",
        "resumo_clinico": "Dor localizada com restrição de ADM. Responde bem à abordagem multimodal (Terapia Manual + Exercício).",
        "intervencoes": [
            {
                "categoria": "Terapia Manual",
                "nivel_evidencia": "Nível B (Moderado/Forte)",
                "tipo": "Mobilização Cervical e Manipulação Torácica",
                "descricao": "Mobilizações PA centrais/unilaterais cervicais e Thrust torácico.",
                "conduta_sugerida": "Manipulação torácica superior provou reduzir dor cervical mecânica imediatamente.",
                "dosagem": {
                    "frequencia": "1-2x semana nas fases agudas",
                    "tecnicas": "Maitland (Graus III e IV) ou Mulligan (SNAGs)"
                },
                "prognostico": "Melhora da ADM e Dor esperada em 2-4 semanas."
            },
            {
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível A (Forte)",
                "tipo": "Fortalecimento Cervico-Escapular",
                "descricao": "Foco em flexores profundos do pescoço e estabilizadores escapulares (Trapézio Med/Inf, Serrátil).",
                "conduta_sugerida": "1. Flexão craniocervical (com biofeedback de pressão se possível). 2. Remadas e abdução horizontal com elástico.",
                "dosagem": {
                    "frequencia": "Diária (exercícios domiciliares) + 2x supervisionado",
                    "volume": "Séries longas (Resistência): 3x15-20"
                }
            }
        ]
    },
    {
        "id": "KOA_01",
        "patologia": "Osteoartrose de Joelho",
        "regiao": "Joelho",
        "fontes_evidencia": ["OARSI Guidelines 2019/2024", "BMJ 2025 Network Meta-analysis"],
        "ultima_atualizacao": "2025-01-02",
        "resumo_clinico": "Doença articular degenerativa. Primeira linha de tratamento é NÃO-CIRÚRGICA e baseada em exercício + perda de peso.",
        "intervencoes": [
            {
                "categoria": "Exercício Terapêutico",
                "nivel_evidencia": "Nível A (Ouro)",
                "tipo": "Fortalecimento de Quadríceps e Aeróbico",
                "descricao": "Melhora da força muscular periarticular reduz carga articular.",
                "conduta_sugerida": "Cadeia Cinética Aberta (Cadeira Extensora) é segura e eficaz. Agachamentos (ângulo protegido). Bicicleta ergométrica.",
                "dosagem": {
                    "frequencia": "3x por semana (supervisionado é superior ao domiciliar)",
                    "intensidade": "Moderada a Vigorosa (70% 1RM para força)",
                    "duracao": "Programas de no mínimo 8 a 12 semanas para efeito consolidado."
                },
                "prognostico": "Redução da dor comparável a AINEs, com ganho funcional superior."
            },
            {
                "categoria": "Terapia Manual",
                "nivel_evidencia": "Nível C (Fraca/Moderada)",
                "tipo": "Mobilização e Alongamento",
                "descricao": "Mobilização acessória de joelho e quadril.",
                "conduta_sugerida": "Útil se houver rigidez articular impedindo a execução correta dos exercícios. Focar em extensão terminal do joelho.",
                "dosagem": {
                    "nota": "Coadjuvante. Não deve substituir o tempo de fortalecimento."
                }
            },
            {
                "categoria": "Gestão de Peso",
                "nivel_evidencia": "Nível A (Forte)",
                "tipo": "Educação / Encaminhamento",
                "descricao": "Perda de peso reduz drasticamente a carga mecânica no joelho.",
                "conduta_sugerida": "Aconselhamento nutricional ou encaminhamento. Perda de 5% do peso corporal já gera alívio sintomático.",
                "dosagem": {
                    "meta": "Redução de >5% a 10% do peso corporal em 6 meses."
                }
            }
        ]
    }
];

export function getProtocolOptions() {
    return CLINICAL_PROTOCOLS.map(p => ({
        id: p.id,
        label: p.patologia
    }));
}

export function formatProtocolToReport(protocol: typeof CLINICAL_PROTOCOLS[0]) {
    let text = `## Protocolo Clínico: ${protocol.patologia}\n`;
    text += `**Região:** ${protocol.regiao}\n`;
    text += `**Fontes:** ${protocol.fontes_evidencia.join(", ")}\n`;
    text += `**Atualização:** ${protocol.ultima_atualizacao}\n\n`;
    text += `**Resumo Clínico:**\n${protocol.resumo_clinico}\n\n`;

    text += `### Intervenções Recomendadas:\n`;
    protocol.intervencoes.forEach(intervention => {
        text += `- **${intervention.tipo}** (${intervention.categoria} - Evidência: ${intervention.nivel_evidencia})\n`;
        text += `  - Descrição: ${intervention.descricao}\n`;
        text += `  - Conduta: ${intervention.conduta_sugerida}\n`;
        if (intervention.dosagem) {
            const doseStr = Object.entries(intervention.dosagem).map(([k, v]) => `${k}: ${v}`).join(' | ');
            text += `  - Dosagem: ${doseStr}\n`;
        }
        if ((intervention as any).prognostico) {
            text += `  - Prognóstico: ${(intervention as any).prognostico}\n`;
        }
        text += `\n`;
    });

    return text;
}
