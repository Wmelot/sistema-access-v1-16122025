'use server'

import OpenAI from 'openai'

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
