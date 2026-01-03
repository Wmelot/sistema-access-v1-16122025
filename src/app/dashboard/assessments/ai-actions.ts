'use server'

import OpenAI from 'openai'
import { CLINICAL_EVIDENCE_BASE } from '@/lib/ai/prompts'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT = `
Você é um Fisiologista do Exercício Sênior e Especialista em Biomecânica.
Sua tarefa é analisar os dados de uma avaliação física completa e gerar um relatório JSON altamente estruturado para o paciente e para o treinador.

BASE DE CONHECIMENTO CIENTÍFICO (PALMILHAS BIOMECÂNICAS):
1. **Pé Plano/Chato**: Revisões sistemáticas e Meta-análises mostram que palmilhas ortopédicas reduzem significativamente a dor e melhoram o alinhamento calcâneo e a cinemática do tornozelo [Ref: ResearchGate, Frontiers].
2. **Osteoartrite de Joelho (Knee OA)**: Palmilhas com cunha lateral reduzem o momento adutor do joelho e a dor no compartimento medial [Ref: NIH, Systematic Reviews].
3. **Fascite Plantar**: Palmilhas contornadas (full-length) são eficazes no alívio de sintomas e melhora da função a médio prazo [Ref: HumanKinetics, NIH].
4. **Hálux Valgo**: Órteses com separadores de dedos são eficazes para aliviar dor e corrigir ângulo leve [Ref: BMJ, ResearchGate].

DIRETRIZ OBRIGATÓRIA (PALMILHAS):
Se o paciente apresentar: DOR (quadril, joelho, tornozelo, pé), VALGO DINÂMICO, PÉ PLANO/CAVO ou FASCITE, você DEVE sugerir "Avaliação para Palmilhas Biomecânicas" no campo 'workout_guide' ou 'semaphor_health.clinical_focus', citando que há evidência científica (Nível A/B) para suporte dessa conduta.

FORMATO DE RESPOSTA (JSON STRICT):
{
  "header": {
    "title": "Avaliação Física Avançada",
    "subtitle": "Relatório de Performance e Saúde",
    "patient_name": "Nome do Paciente",
    "goal": "Objetivo Principal"
  },
  "semaphor_health": {
    "status": "EXCELENTE" | "BOM" | "ATENÇÃO" | "CRÍTICO",
    "color_code": "green" | "yellow" | "red",
    "message": "Mensagem curta de impacto sobre o estado geral.",
    "clinical_focus": "Foco clínico principal (Inclua sugestão de palmilhas se indicado)."
  },
  "radar_analysis": {
    "summary": "Resumo geral do gráfico de radar (Força, Cardio, Flexibilidade, Composição, Vitalidade).",
    "strongest_point": "Qual o ponto mais forte e por quê?",
    "weakest_point": "Qual o ponto mais fraco e por quê?"
  },
  "patient_text": {
    "summary": "Texto amigável e motivacional explicado para o LEIGO. O que ele precisa saber sobre o corpo dele hoje?",
    "key_wins": ["Ponto positivo 1", "Ponto positivo 2"],
    "key_improvements": ["O que precisa melhorar 1", "O que precisa melhorar 2"]
  },
  "trainer_text": {
    "guidance": "Texto TÉCNICO para o Personal Trainer. Fale sobre cadeias cinéticas, desequilíbrios e periodização sugerida.",
    "periodization_suggestion": "Sugestão de mesociclo (ex: 4 semanas focado em RML e Mobilidade).",
    "attention_points": ["Cuidado com agachamento profundo", "Evitar sobrecarga axial"]
  },
  "biomechanics": {
    "alerts": [
      { "issue": "Valgo/Pé Plano", "severity": "high/medium/low", "explanation": "Explicação técnica. Cite evidência sobre palmilhas se relevante." }
    ],
    "strengths": ["Boa estabilidade de core", "Boa mobilidade de tornozelo"]
  },
  "workout_guide": [
    {
      "action": "PRIORIZAR",
      "exercises": ["Exercício 1 (ou Palmilhas)"],
      "reason": "Justificativa com base científica."
    },
    {
      "action": "EVITAR",
      "exercises": ["Exercício Perigoso 1"],
      "reason": "Risco biomecânico."
    }
  ]
}

Seja direto, profissional, mas motivador.
`

export async function generateAssessmentReport(data: any) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return { error: 'OpenAI API Key not configured' }
    }

    // 1. Format Payload for AI
    const payload = {
      PERFIL: {
        Idade: data.antro.age,
        Genero: data.antro.gender,
        Nivel: data.anamnesis.trainingLevel,
        Objetivo: data.anamnesis.goal
      },
      SAUDE: {
        FC_Repouso: data.vitals.restingHeartRate,
        PA: `${data.vitals.bloodPressureSys}/${data.vitals.bloodPressureDia}`,
        Queixa: data.anamnesis.mainComplaint,
        HMA: data.anamnesis.history
      },
      POSTURA_CHECKLIST: data.posture.observations,
      COMPOSICAO: {
        Cintura: data.perimetry.waist,
        Quadril: data.perimetry.hip,
        Gordura: data.antro.fatPercent // Assuming it's calculated in frontend, might need raw
      },
      PERFORMANCE: {
        VO2: data.cardio.vo2, // Assuming calculated
        Flexibilidade_Wells: data.mobility.wells,
        Forca_Global: data.strength.testResults // Passing raw results simplified
      }
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(payload) }
      ],
      temperature: 0.5,
      response_format: { type: "json_object" }
    })

    const content = response.choices[0].message.content
    if (!content) throw new Error('No content received')

    const report = JSON.parse(content)

    return { success: true, report }

  } catch (error) {
    console.error('AI Report Error:', error)
    return { error: 'Failed to generate report' }
  }
}

const SMART_SYSTEM_PROMPT = `
Atue como um Fisioterapeuta Especialista em Prática Baseada em Evidências (PBE) e Diagnóstico Cinesiológico.
Analise os dados da avaliação clínica e gere um relatório de Raciocínio Clínico.

IMPERATIVO:
Utilize a seguinte Base de Conhecimento Clínico para fundamentar suas sugestões de órteses (palmilhas) e tratamentos.
Se a condição do paciente se encaixar em alguma dessas patologias, cite explicitamente os artigos e diretrizes mencionados.

BASE DE CONHECIMENTO (CITE ESTAS FONTES QUANDO RELEVANTE):
${JSON.stringify(CLINICAL_EVIDENCE_BASE, null, 2)}

OBJETIVO:
Fornecer hipóteses diagnósticas, bandeiras vermelhas (se houver), e sugestões de tratamento baseadas em evidências.

FORMATO DE RESPOSTA (JSON STRICT):
{
  "summary": {
    "patient_profile": "Resumo do perfil (Nome, Idade, Atividade)",
    "main_complaint": "Resumo da queixa e história"
  },
  "clinical_reasoning": {
    "red_flags": {
      "detected": boolean,
      "warnings": ["Lista de bandeiras vermelhas encontradas e ação recomendada (ex: Encaminhar médico)"]
    },
    "hypothesis": ["Hipótese Diagnóstica 1", "Hipótese Diagnóstica 2"],
    "mechanism": "Explicação provável do mecanismo de lesão (biomecânico/carga)"
  },
  "pbe_suggestions": {
    "education": "Pontos chave para educação do paciente (Explicação da dor, prognóstico)",
    "manual_therapy": ["Sugestão 1", "Sugestão 2"],
    "exercises": [
      { "name": "Nome do Exercício", "dose": "Série/Rep", "purpose": "Objetivo (ex: Controle Motor)" }
    ],
    "orthotics": {
        "indicated": boolean,
        "reason": "Se indicado, explicar o porquê baseado na biomecânica (ex: Pé plano flexível sintomático)",
        "specification": "Elementos sugeridos (ex: Suporte de arco, cunha)"
    }
  }
}
`

export async function generateSmartAssessmentReport(data: any) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return { error: 'OpenAI API Key not configured' }
    }

    // 1. Format Payload for AI (Smart Form Structure)
    const payload = {
      PACIENTE: {
        Idade: data.initialData?.antro?.age || "N/A", // Might not be present in smart form directly, usually mapped from patient
        Queixa_Principal: data.qp,
        HMA: data.hma,
        Tempo: data.painDuration,
        EVA: data.eva
      },
      BANDEIRAS_VERMELHAS: data.redFlags,
      EXAME_FISICO: {
        Regiao: data.anamnesis?.mainRegion,
        Observacoes: data.physicalExam?.observation,
        Movimento: data.physicalExam?.movementQuality,
        ADM_Restrita: data.physicalExam?.rom, // Pass full object, AI interprets
        Testes_Especiais: data.physicalExam?.specialTests,
        Neurologico: data.neurological
      },
      FUNCIONAL: data.functional
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SMART_SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(payload) }
      ],
      temperature: 0.4, // Lower temp for more clinical precision
      response_format: { type: "json_object" }
    })

    const content = response.choices[0].message.content
    if (!content) throw new Error('No content received')

    const report = JSON.parse(content)

    return { success: true, report }

  } catch (error) {
    console.error('Smart AI Report Error:', error)
    return { error: 'Failed to generate report' }
  }
}
