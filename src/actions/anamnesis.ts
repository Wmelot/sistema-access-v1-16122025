"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { addDays } from "date-fns"
import { updateAppointmentStatus } from "@/actions/appointments"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { CLINICAL_EVIDENCE_BASE, REGIONAL_EVIDENCE_BASE } from '@/lib/ai/prompts'


export async function getAttendanceData(appointmentId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    // 1. Fetch Appointment + Patient
    const { data: appointment, error: apptError } = await supabase
        .from('appointments')
        .select(`
            *,
            patients (*),
            profiles:professional_id (*)
        `)
        .eq('id', appointmentId)
        .single()

    if (apptError || !appointment) {
        throw new Error("Agendamento não encontrado")
    }

    // 2. Fetch Templates (All active)
    let templates: any[] = []
    try {
        const { data: tmpl } = await supabase
            .from('form_templates')
            .select('*')
            .eq('is_active', true)
            .order('title', { ascending: true })
        templates = tmpl || []
    } catch (e) {
        console.warn("Error fetching templates:", e)
    }

    // 3. Fetch User Preferences
    let preferences: any[] = []
    try {
        const { data: prefs } = await supabase
            .from('user_template_preferences')
            .select('*')
            .eq('user_id', user.id)
        preferences = prefs || []
    } catch (e) {
        console.warn("Could not fetch preferences:", e)
    }

    // 4. Fetch Existing Record
    let existingRecord = null
    try {
        const { data: record } = await supabase
            .from('patient_records')
            .select('*')
            .eq('appointment_id', appointmentId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        existingRecord = record
    } catch (e) {
        console.log(`[getAttendanceData] Error fetching existingRecord for ${appointmentId}:`, e)
    }

    // 5. Fetch Patient History
    let history: any[] = []
    try {
        const { data: hist } = await supabase
            .from('patient_records')
            .select(`
                *,
                form_templates (title),
                profiles (full_name)
            `)
            .eq('patient_id', appointment.patient_id!)
            .neq('appointment_id', appointmentId)
            .order('created_at', { ascending: false })
            .limit(5)
        history = hist || []
    } catch (e) {
        console.warn("Error fetching history:", e)
    }

    // 6. Fetch Questionnaires/Assessments (Legacy + Generic)
    let assessments: any[] = []
    try {
        const { data: legacyAssess } = await supabase
            .from('patient_assessments')
            .select(`
                *,
                profiles (full_name)
            `)
            .eq('patient_id', appointment.patient_id!)
            .order('created_at', { ascending: false })

        assessments = (legacyAssess || []).map((item: any) => ({
            ...item,
            isLegacy: true,
            title: item.title || item.type,
            author: item.profiles?.full_name || item.professionals?.name
        }))

    } catch (e: any) {
        console.warn("Error fetching assessments:", e)
    }

    // 7. Fetch Payment Methods
    let paymentMethods: any[] = []
    try {
        const { data: pm } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('active', true)
            .order('name')
        paymentMethods = pm || []
    } catch (e) {
        console.warn("Error fetching payment methods:", e)
    }

    // 8. Professionals
    let professionals: any[] = []
    try {
        const { data: profs } = await supabase.from('profiles').select('id, full_name, name')
        professionals = profs || []
    } catch (e) { }

    return {
        appointment,
        patient: appointment.patients,
        templates,
        preferences,
        existingRecord,
        history,
        assessments: assessments || [],
        paymentMethods,
        professionals
    }
}

export async function startAttendance(appointmentId: string) {
    const supabase = await createClient()
    await supabase.from('appointments').update({ status: 'in_progress' }).eq('id', appointmentId)
    revalidatePath(`/dashboard/schedule`)
    return { success: true }
}

export async function saveAttendanceRecord(data: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, msg: "Unauthorized" }

    const { appointment_id, patient_id, template_id, content, record_id, record_type } = data

    let finalContent = content
    let finalTemplateId = template_id
    let finalRecordType = record_type

    if (template_id === 'system-physical-assessment') {
        finalTemplateId = null
        finalRecordType = 'assessment'
    }

    const payload = {
        appointment_id,
        patient_id,
        template_id: finalTemplateId,
        content: finalContent,
        professional_id: user.id,
        updated_at: new Date().toISOString(),
        ...(finalRecordType && { record_type: finalRecordType })
    }

    let error;
    let dataResult;

    if (record_id) {
        const { data: existingRecord } = await supabase
            .from('patient_records')
            .select('created_at, updated_at')
            .eq('id', record_id)
            .single()

        if (existingRecord) {
            const baseDate = new Date((existingRecord.updated_at || existingRecord.created_at) as string)
            const now = new Date()
            const diffInHours = (now.getTime() - baseDate.getTime()) / (1000 * 60 * 60)

            if (diffInHours > 24 && user.role !== 'admin' && user.role !== 'master') {
                return { success: false, error: 'Bloqueio de Conformidade (LGPD): Prontuários com mais de 24 horas sem atividade são imutáveis.' }
            }
        }
        const res = await supabase.from('patient_records').update(payload).eq('id', record_id).select().single()
        error = res.error
        dataResult = res.data
    } else {
        const res = await supabase.from('patient_records').insert(payload).select().single()
        error = res.error
        dataResult = res.data
    }

    if (error) {
        console.error("Save Error", error)
        return { success: false, msg: "Erro ao salvar: " + error.message }
    }

    return { success: true, data: dataResult }
}

export async function finishAttendance(appointmentId: string, recordData: any = null) {
    const supabase = await createClient()

    if (recordData) {
        await saveAttendanceRecord(recordData)
    }

    // --- AUTOMATION TRIGGER START ---
    try {
        const adminClient = createAdminClient()
        const { data: appointment } = await adminClient
            .from('appointments')
            .select(`*, services (name)`)
            .eq('id', appointmentId)
            .single()

        if (appointment && appointment.services?.name) {
            const serviceName = appointment.services.name.toLowerCase()
            const isInsoleDelivery = serviceName.includes('palmilha') && serviceName.includes('entrega')

            if (isInsoleDelivery) {
                const { data: templates } = await supabase
                    .from('message_templates')
                    .select('*')
                    .eq('is_active', true)
                    .in('trigger_type', ['insole_delivery'])

                if (templates && templates.length > 0) {
                    const followUpsToInsert = templates.map((tmpl: any) => ({
                        patient_id: appointment.patient_id!,
                        type: 'insoles_delivery',
                        message_template_id: tmpl.id,
                        scheduled_date: addDays(new Date(), tmpl.delay_days || 0).toISOString(),
                        status: 'pending',
                        delivery_date: new Date().toISOString(),
                        token: crypto.randomUUID(),
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }))

                    await supabase.from('assessment_follow_ups').insert(followUpsToInsert)
                    console.log(`[Automation] Scheduled ${followUpsToInsert.length} follow-ups for Insole Delivery`)
                }
            }
        }
    } catch (err) {
        console.error("[Automation Error] Failed to schedule follow-ups:", err)
    }
    // --- AUTOMATION TRIGGER END ---

    // Use Centralized Status Update for Commission/Invoice Sync
    await updateAppointmentStatus(appointmentId, 'completed')

    revalidatePath('/dashboard/schedule')
    redirect('/dashboard/schedule')
}

export async function getPatientStats(patientId: string) {
    const supabase = await createClient()

    try {
        const { data: records, error } = await supabase
            .from('patient_records')
            .select('created_at, content')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Error fetching stats:', error)
            return { success: false, data: [] }
        }

        const stats = records.map(record => {
            const content: any = record.content || {}
            if (!content.antro && !content.cardio) return null

            return {
                date: new Date(record.created_at as string).toLocaleDateString('pt-BR'),
                weight: content.antro?.weight ? Number(content.antro.weight) : null,
                // Check if antroResult exists before accessing fatPercent
                fatPercent: content.antroResult?.fatPercent ? Number(content.antroResult.fatPercent) : null,
                vo2: content.cardioResult?.vo2 ? Number(content.cardioResult.vo2) : null,
                relativeForce: content.strengthResult?.relativeForce ? Number(content.strengthResult.relativeForce) : null,
                symmetry: content.strengthResult?.symmetryIndex ? Number(content.strengthResult.symmetryIndex) : null,
                wells: content.mobility?.wells ? Number(content.mobility.wells) : null,
            }
        }).filter(item => item !== null)

        return { success: true, data: stats }

    } catch (error) {
        console.error('Unexpected error fetching stats:', error)
        return { success: false, data: [] }
    }
}

// --- AI TRANSCRIPTION ---
export async function transcribeAndOrganize(formData: FormData) {
    try {
        const file = formData.get('file') as File
        if (!file) {
            return { success: false, msg: 'Arquivo de áudio não encontrado.' }
        }

        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            return { success: false, msg: 'chave GEMINI_API_KEY não configurada.' }
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" })

        // 1. Prepare Audio
        const arrayBuffer = await file.arrayBuffer()
        const base64Audio = Buffer.from(arrayBuffer).toString('base64')

        // 2. Transcribe & Organize (Single Step with Gemini)
        const prompt = `
        Você é um assistente especialista em Fisioterapia. 
        Sua tarefa é analisar o áudio fornecido (que é uma evolução clínica ditada) e transcrevê-lo JÁ ORGANIZADO em um texto clínico profissional.

        Regras:
        - Corrija erros gramaticais e de concordância.
        - Ajuste termos técnicos se estiverem escritos errados.
        - Mantenha o tom profissional e objetivo.
        - Se o texto for muito curto ou informal, transforme-o em frases completas.
        - NÃO adicione informações que não foram ditas.
        - Formato preferido: Texto corrido organizado ou tópicos (se houver muita informação diferente).
        - Se o usuário ditar "Pular linha" ou "Novo parágrafo", respeite.

        Retorne APENAS o texto formatado, sem introduções.
        `

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: file.type || 'audio/mp3',
                    data: base64Audio
                }
            },
            { text: prompt }
        ])

        const organizedText = result.response.text()

        return { success: true, text: organizedText, raw: organizedText }

    } catch (error: any) {
        console.error('AI Error:', error)
        return { success: false, msg: error.message || 'Erro ao processar áudio.' }
    }
}

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
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            return { error: 'GEMINI_API_KEY not configured' }
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({
            model: 'gemini-flash-latest',
            generationConfig: { responseMimeType: "application/json" }
        })

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

        const result = await model.generateContent({
            contents: [
                { role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\nJSON PAYLOAD:\n" + JSON.stringify(payload) }] }
            ]
        })

        const content = result.response.text()
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
Utilize as seguintes Bases de Conhecimento Clínico e Regional para fundamentar suas sugestões.

1. EVIDÊNCIA CLÍNICA GERAL (PALMILHAS & ORTÓTICA):
${JSON.stringify(CLINICAL_EVIDENCE_BASE, null, 2)}

2. DIAGNOSTICO REGIONAL ESPECÍFICO (Diretrizes, Testes Chave e Bandeiras Vermelhas Locais):
${JSON.stringify(REGIONAL_EVIDENCE_BASE, null, 2)}

INSTRUÇÕES DE ANÁLISE REGIONAL:
- Identifique a 'Regiao' informada no EXAME_FISICO.
- Correlacione os 'Testes_Especiais' positivos com os 'key_tests' da REGIONAL_EVIDENCE_BASE correspondente.
- Se houver testes positivos específicos (ex: Lachman +), aumente a probabilidade da hipótese associada (ex: Ruptura de LCA) e cite a diretriz.
- Verifique se algum dado da anamnese ou exame físico corresponde aos 'red_flags' específicos da região.

DIRETRIZES DE TRIAGEM (BANDEIRAS VERMELHAS GERAIS):
Analise o histórico (HMA, Idade, Sintomas) em busca destes sinais críticos. Se identificar QUALQUER um, marque "detected": true e liste no campo "warnings" do JSON.

1. MALIGNIDADE (Câncer / Metástase) -> LR+ 14.7 (Histórico Prévio)
   - Histórico prévio de câncer (Sinal isolado mais forte)
   - Perda de peso inexplicada
   - Idade > 50 anos (ou < 20 para tumores específicos)
   - Dor noturna intensa/constante que não melhora com repouso
   - Falha na melhora após 1 mês de tratamento

2. FRATURA VERTEBRAL
   - Trauma significativo recente ou menor em idosos/osteoporóticos
   - Uso prolongado de Corticosteroides
   - Idade > 70 anos
   - Contusão/Abrasão visível

3. INFECÇÃO (Espondilodiscite/Osteomielite)
   - Febre, Uso drogas IV, Infecção recente (ITU, Pele, Pneumonia)
   - Imunossupressão
   - Dor profunda e constante, piora à percussão espinhosa

4. SÍNDROME DA CAUDA EQUINA (EMERGÊNCIA)
   - Retenção Urinária ou Incontinência Fecal
   - Anestesia em Sela (Períneo/Coxas internas)
   - Déficit motor progressivo/grave bilateral
   - Disfunção sexual recente

5. ESPONDILOARTROPATIA INFLAMATÓRIA
   - Rigidez matinal > 30 min
   - Melhora com movimento, piora com repouso
   - Despertar 2ª metade da noite
   - Dor alternante nas nádegas
   - Início < 40 anos

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
      "warnings": ["Lista de bandeiras vermelhas encontradas e ação recomendada (ex: Encaminhar médico). Seja específico qual sinal foi encontrado."]
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
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            return { error: 'GEMINI_API_KEY not configured' }
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({
            model: 'gemini-flash-latest',
            generationConfig: { responseMimeType: "application/json" }
        })

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

        const result = await model.generateContent({
            contents: [
                { role: "user", parts: [{ text: SMART_SYSTEM_PROMPT + "\n\nJSON PAYLOAD:\n" + JSON.stringify(payload) }] }
            ]
        })

        const content = result.response.text()
        if (!content) throw new Error('No content received')

        const report = JSON.parse(content)

        return { success: true, report }

    } catch (error) {
        console.error('Smart AI Report Error:', error)
        return { error: 'Failed to generate report' }
    }
}
