'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Send, FileText, CheckCircle, Smartphone, Sparkles, Bot, Save } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { ptBR } from 'date-fns/locale'
import { sendReportViaWhatsapp } from '../actions/reports'
import { uploadPatientDocument } from '@/actions/documents'
import { generateGenericReport } from '@/app/dashboard/[slug]/reports/ai-actions'
import { format } from 'date-fns'
import { pdf } from '@react-pdf/renderer'
import { ReportPdf } from '@/components/reports/ReportPdf'
import { RichTextEditor } from '@/components/reports/rich-text-editor'
import { VariablePicker } from '@/components/reports/variable-picker'
import { getFormTemplates, getReportTemplates } from '@/app/dashboard/[slug]/settings/reports/actions'
import { createClient } from '@/lib/supabase/client'

interface PatientReportsTabProps {
    patientId: string
    patientName: string
    professionalName?: string
    records?: any[]
    slug?: string
}

// [CONFIG] Preset Generation Scripts (Prompts)
// You can edit these scripts to customize how the AI generates reports for specific form types.
const PRESET_PROMPTS: Record<string, string> = {
    'Palmilha': `
            Atue como um Especialista em Biomecânica e Podoposturologia Sênior. Gere um Laudo de Avaliação de Palmilhas Biomecânicas altamente técnico, visualmente organizado e didático para o paciente.

            **ESTRUTURA OBRIGATÓRIA DO LAUDO:**

            ## 1. 🦶 Análise Biomecânica & Estática
            *   **Tipo de Pisada:** Identifique se é Cava, Plana ou Neutra (Use os dados de Navicular/Calçado).
            *   **Alinhamento do Retropé:** Descreva se há Valgo, Varo ou Neutro.
            *   **Dismetria:** Se houver diferença de membros > 5mm, destaque com ⚠️ **ATENÇÃO**.
            
            ## 2. 📊 Baropodometria e Pressão Plantar
            *   Descreva onde estão os **Picos de Pressão** (Antepé vs Retropé).
            *   Analise a distribuição de carga entre Esquerda vs Direita (Ideal 50/50).
            
            ## 3. 🛠️ Prescrição e Tratamento Proposto
            Sugira os elementos da palmilha baseando-se na patologia e biomecânica:
            *   **Elementos Sugeridos:** (Ex: Piloto, Barra Metatarsal, Cunha Varizante). *Explique o porquê de cada um*.
            *   **Correções:** (Ex: Elevação de 5mm no calcanhar E para dismetria).
            
            ## 4. 📝 Conclusão Clínica
            *   Justifique a necessidade da palmilha (Ex: "Reduzir pico de pressão em metatarsos", "Melhorar alinhamento de retropé").
            *   Use **tom clínico ortopédico**, mas com linguagem acessível ao paciente.

            **Formatação:** Use Markdown, Negrito para destaques e Tabelas se houver muitos dados comparativos (Esq vs Dir).
            `,
    'Avaliação Física': `
            Gere um Relatório de Performance Física e Saúde.
            Foque em:
            - Composição Corporal (% Gordura, Massa Magra).
            - Força Muscular (Destaque desequilíbrios).
            - Flexibilidade.
            Conclua com recomendações de treino para corrigir os pontos fracos.
            `,
    'Evolução': `
            Resuma a evolução do paciente focando em:
            - Melhora da dor (Compare VAS inicial e final se disponível).
            - Ganho de amplitude de movimento.
            - Funcionalidade no dia a dia.
            Seja sucinto e direto.
            `
}

// Predefined Templates (Unchanged)
const REPORT_TEMPLATES = [
    {
        id: 'atestado_comparecimento',
        title: 'Atestado de Comparecimento',
        content: `ATESTADO DE COMPARECIMENTO\n\nAtesto para os devidos fins que o(a) Sr(a). {{ PACIENTE }} compareceu a este serviço de fisioterapia na data de hoje, {{ DATA }}, no horário de {{ HORARIO }}, para realização de tratamento fisioterapêutico.\n\n{{ PROFISSIONAL }}\nFisioterapeuta`
    },
    {
        id: 'declaracao_acompanhamento',
        title: 'Declaração de Acompanhamento',
        content: `DECLARAÇÃO\n\nDeclaro que o(a) Sr(a). {{ PACIENTE }} encontra-se em tratamento fisioterapêutico sob meus cuidados, necessitando de acompanhamento regular.\n\nAtenciosamente,\n\n{{ PROFISSIONAL }}\nFisioterapeuta`
    },
    {
        id: 'encaminhamento',
        title: 'Encaminhamento',
        content: `ENCAMINHAMENTO\n\nAo(A) Dr(a). Especialista,\n\nEncaminho o(a) paciente {{ PACIENTE }} para avaliação e conduta, apresentando quadro de [DESCREVER QUADRO].\n\nSigo à disposição para discussão do caso.\n\nAtenciosamente,\n\n{{ PROFISSIONAL }}\nFisioterapeuta`
    },
    {
        id: 'relatorio_evolucao',
        title: 'Relatório de Evolução',
        content: `RELATÓRIO DE EVOLUÇÃO\n\nPaciente: {{ PACIENTE }}\nData: {{ DATA }}\n\nPaciente vem apresentando evolução [SATISFATÓRIA/ESTÁVEL] ao tratamento proposto. Observa-se melhora na amplitude de movimento e redução do quadro álgico.\n\nPlano terapêutico mantido.\n\n{{ PROFISSIONAL }}\nFisioterapeuta`
    },
    {
        id: 'relatorio_reembolso',
        title: 'Relatório para Reembolso (Convênio)',
        content: `RELATÓRIO DE ATENDIMENTO PARA REEMBOLSO\n\nPaciente: {{patient_name}}\nMês de Referência: {{financeiro_mes_extenso}} / {{financeiro_ano}}\n\nDurante o mês de {{financeiro_mes_extenso}}, foram realizados {{financeiro_qtd_atendimentos}} atendimentos nesta clínica para o(a) paciente acima citado(a).\n\nO valor de cada sessão é de {{financeiro_valor_sessao}}, totalizando {{financeiro_valor_total}}.\n\nAs sessões ocorreram nas seguintes datas:\n{{financeiro_lista_datas}}\n\nPor ser verdade, firmo o presente.\n\n{{profissional_nome}}\n{{profissional_registro}}\n{{profissional_especialidade}}`
    }
]

export function PatientReportsTab({ patientId, patientName, professionalName = "Fisioterapeuta", records = [], slug }: PatientReportsTabProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<string>('')
    const [content, setContent] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [formTemplates, setFormTemplates] = useState<any[]>([])
    const [reportTemplates, setReportTemplates] = useState<any[]>([])
    const [professionalProfile, setProfessionalProfile] = useState<any>(null)

    // [BILLING REPORT STATE]
    const [billingMonth, setBillingMonth] = useState<string>(format(new Date(), 'yyyy-MM'))
    const [monthlyStats, setMonthlyStats] = useState({
        count: 0,
        total: 0,
        unitValue: 0,
        dates: [] as string[],
        monthName: '',
        year: '',
        countWords: ''
    })

    // Load form templates and professional details
    useEffect(() => {
        const loadData = async () => {
            const supabase = createClient()
            const templates = await getFormTemplates()
            setFormTemplates(templates || [])

            const rTemplates = await getReportTemplates(slug)
            setReportTemplates(rTemplates || [])

            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()
                if (profData) setProfessionalProfile(profData)
            }
        }
        loadData()
    }, [])

    // Fetch Billing Data when month changes
    useEffect(() => {
        const fetchBillingData = async () => {
            if (!patientId || !billingMonth) return

            const supabase = createClient()
            const [year, month] = billingMonth.split('-')
            const startDate = `${billingMonth}-01T00:00:00`
            const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0] + 'T23:59:59'

            const { data: apps } = await supabase
                .from('appointments')
                .select('start_time, price, status')
                .eq('patient_id', patientId)
                .gte('start_time', startDate)
                .lte('start_time', endDate)
                .in('status', ['attended', 'billed', 'confirmed']) // Count these
                .order('start_time', { ascending: true })

            if (apps) {
                const count = apps.length
                const total = apps.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0)
                const unitValue = count > 0 ? (total / count) : 0
                const dates = apps.map(a => format(new Date(a.start_time), 'dd/MM'))

                const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1)
                const monthName = format(dateObj, 'MMMM', { locale: ptBR })

                const numberToWords = (n: number) => {
                    const words = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez"]
                    return n <= 10 ? words[n] : String(n)
                }

                setMonthlyStats({
                    count,
                    total,
                    unitValue,
                    dates,
                    monthName: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                    year,
                    countWords: numberToWords(count)
                })
            }
        }
        fetchBillingData()
    }, [billingMonth, patientId])

    // [DEBUG] Check records
    useEffect(() => {
        console.log('PatientReportsTab Records:', records)
        if (!records || records.length === 0) {
            console.warn('No records passed to PatientReportsTab')
        }
    }, [records])

    // [NEW] AI States
    const [selectedRecordId, setSelectedRecordId] = useState<string>(records?.[0]?.id || '')
    const [aiInstructions, setAiInstructions] = useState<string>('')
    const [radarData, setRadarData] = useState<any[]>([])
    const [dfiData, setDfiData] = useState<any[]>([])
    const [extraData, setExtraData] = useState<any>({})

    // Auto-select latest record if not set
    useEffect(() => {
        if (!selectedRecordId && records && records.length > 0) {
            setSelectedRecordId(records[0].id)
        }
    }, [records])

    // [HELPER] Extract Rich Data from Record
    const extractReportData = (record: any) => {
        if (!record || !record.content) return {}
        const data = record.content

        // 1. Structured Access (BiomechanicsForm / PalmilhaForm)
        const shoeInfo = {
            weight: data.shoeAnalysis?.weight || data.shoe?.weight || data['min_peso_v3'] || '',
            drop: data.shoeAnalysis?.drop || data.shoe?.drop || data['min_drop_v3'] || '',
            stack: data.shoeAnalysis?.stack || data.shoe?.stack || data['min_pilha_v3'] || '',
            flexibility: data.shoeAnalysis?.flexibility || data['min_flex_long_v3'] || '',
            minimalismIndex: data.shoeAnalysis?.minimalismIndex || data['min_calc_index_v3'] || undefined
        }

        const plantigraphy2D = data.photos?.plantigraphy2D?.[0]?.url || data.photos?.plantigraphy2D?.[0]?.preview || data['zpmpp93p9']?.[0]?.url || null
        const plantigraphy3D = data.photos?.plantigraphy3D?.[0]?.url || data.photos?.plantigraphy3D?.[0]?.preview || data['dfn6uakix']?.[0]?.url || null

        const examImages = { plantigraphy2D, plantigraphy3D }

        let formRadarData = []
        if (data.radarResults) {
            formRadarData = data.radarResults
        } else if (data.hma && (data.efep || data.postural)) {
            // New Palmilha 2.0 structure - need to import or use a helper
            // We'll try to calculate or at least extract EVA
        } else if (data['e4pg81lur']) { // Legacy
            const grid = data['e4pg81lur']
            const rows = ["Dor", "Estabilidade", "Força", "Flexibilidade", "Função", "Postura", "Simetria"]
            formRadarData = rows.map((subject, index) => {
                const val = grid[`${index}-0`]
                return { subject, A: parseInt(val) || 0, fullMark: 100 }
            }).filter(d => d.A > 0 || d.subject === "Dor")
        }

        let dfiData: any[] = []
        if (data.dfi) {
            dfiData = [
                { phase: 'Contato Inicial', left: String(data.dfi.left?.initial || 0), right: String(data.dfi.right?.initial || 0) },
                { phase: 'Resposta Carga', left: String(data.dfi.left?.loading || 0), right: String(data.dfi.right?.loading || 0) },
                { phase: 'Impulsão', left: String(data.dfi.left?.propulsion || 0), right: String(data.dfi.right?.propulsion || 0) }
            ]
        } else if (data.tests?.dfi) {
            const dfi = data.tests.dfi;
            dfiData = [
                { phase: 'Inicial', left: dfi[0]?.left || '0', right: dfi[0]?.right || '0' },
                { phase: 'Carga', left: dfi[1]?.left || '0', right: dfi[1]?.right || '0' },
                { phase: 'Impulsão', left: dfi[2]?.left || '0', right: dfi[2]?.right || '0' }
            ]
        }

        let painMapData: any[] = []
        if (data.painMap) {
            painMapData = [
                ...(data.painMap.anterior || []).map((p: any) => ({ ...p, view: 'anterior' })),
                ...(data.painMap.posterior || []).map((p: any) => ({ ...p, view: 'posterior' })),
                ...(data.painMap.feet || []).map((p: any) => ({ ...p, view: 'feet' }))
            ]
        } else if (data.painPoints) { // Palmilha 2.0 structure
            painMapData = (data.painPoints || []).map((p: any) => ({ ...p, view: p.view || 'anterior' }))
        } else {
            const mapPoints = (points: any[], view: string) => points?.map((p: any) => ({ ...p, view })) || []
            painMapData = [
                ...mapPoints(data['jws839roq']?.points, 'anterior'),
                ...mapPoints(data['nh49wopa0']?.points, 'posterior'),
                ...mapPoints(data['vr7fahfmp']?.points, 'feet')
            ]
        }

        return {
            shoeInfo,
            examImages,
            formRadarData,
            dfiData,
            painMapData,
            patientAge: data.patientProfile?.age || data.anthropometry?.age || '',
            painLevel: data.painLevel !== undefined ? data.painLevel : (data.hma?.eva?.[0] !== undefined ? data.hma.eva[0] : (data['ev4_pain'] ? parseInt(data['ev4_pain']) : undefined)),
            painDuration: data.painDuration || (data.hma?.history_duration),
            mainComplaint: data.qp || data.mainComplaint || data.hma?.qp
        }
    }

    // [NEW] Auto-extract data when record changes
    useEffect(() => {
        if (!selectedRecordId || !records) return

        const record = records.find(r => r.id === selectedRecordId)
        if (record) {
            // Extract visual data immediately
            const extracted = extractReportData(record)
            setExtraData(extracted)
            if (extracted.formRadarData) setRadarData(extracted.formRadarData)
            if (extracted.dfiData) setDfiData(extracted.dfiData)

            // Auto-load Instructions
            if (record.form_templates) {
                const title = record.form_templates.title || ''
                // Check presets
                const presetKey = Object.keys(PRESET_PROMPTS).find(key => title.includes(key) || key.includes(title))
                if (presetKey) {
                    setAiInstructions(PRESET_PROMPTS[presetKey])
                } else if (title.toLowerCase().includes('palmilha') || title.toLowerCase().includes('biomecânica')) {
                    // Fallback for Biomechanics if not in presets
                    setAiInstructions("Agir como especialista em biomecânica. Analisar os dados de cada pé separadamente. Criar seções: 1. Análise Estática e Dinâmica 2. Baropodometria 3. Conclusão e Indicação de Palmilha. Seja técnico e direto.")
                } else {
                    setAiInstructions("Gere um relatório detalhado da consulta, focando na evolução e plano de tratamento.")
                }
            }
        }
    }, [selectedRecordId, records])

    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplate(templateId)
        // Check local first, then DB
        const template = REPORT_TEMPLATES.find(t => t.id === templateId) || reportTemplates.find(t => t.id === templateId)
        if (template) {
            // Auto-fill variables
            const now = new Date()
            const dateStr = now.toLocaleDateString('pt-BR')
            const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

            const filledContent = template.content
                .replace(/{{ PACIENTE }}/g, patientName)
                .replace(/{{patient_name}}/g, patientName)
                .replace(/{{ DATA }}/g, dateStr)
                .replace(/{{ data_atual }}/g, dateStr)
                .replace(/{{ HORARIO }}/g, timeStr)
                .replace(/{{ PROFISSIONAL }}/g, professionalName)
                .replace(/{{profissional_nome}}/g, professionalName)
                .replace(/{{profissional_registro}}/g, professionalProfile?.registry || '')
                .replace(/{{profissional_especialidade}}/g, professionalProfile?.specialty || '')
                // Financial Variables
                .replace(/{{financeiro_mes_extenso}}/g, monthlyStats.monthName)
                .replace(/{{financeiro_ano}}/g, monthlyStats.year)
                .replace(/{{financeiro_qtd_atendimentos}}/g, `${monthlyStats.count} (${monthlyStats.countWords})`)
                .replace(/{{financeiro_valor_sessao}}/g, new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyStats.unitValue))
                .replace(/{{financeiro_valor_total}}/g, new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyStats.total))
                .replace(/{{financeiro_lista_datas}}/g, monthlyStats.dates.join(', '))

            // Convert line breaks to HTML for the Rich Editor if it looks like plain text
            const htmlContent = filledContent.includes('<p>') ? filledContent : filledContent.split('\n').map((line: string) => `<p>${line}</p>`).join('')
            setContent(htmlContent)
        }
    }

    // [NEW] AI Generation Handler
    const handleGenerateAI = async () => {
        if (!selectedRecordId) {
            toast.error("Selecione um formulário base.")
            return
        }

        const record = records?.find(r => r.id === selectedRecordId)
        if (!record || !record.content) { // Ensure record has content
            toast.error("Formulário vazio ou inválido.")
            return
        }

        setGenerating(true)
        try {
            // [SANITIZATION] Deep Recursive Sanitization
            // Walks through the entire object tree to remove large strings (images)
            const deepSanitize = (obj: any): any => {
                if (typeof obj === 'string') {
                    // Remove Base64 images or very long strings (likely binary/images)
                    if (obj.startsWith('data:image') || obj.length > 2000) {
                        return '[Removido]'
                    }
                    return obj
                }

                if (Array.isArray(obj)) {
                    return obj.map(item => deepSanitize(item))
                }

                if (obj && typeof obj === 'object') {
                    const newObj: any = {}
                    for (const key in obj) {
                        if (Object.prototype.hasOwnProperty.call(obj, key)) {
                            newObj[key] = deepSanitize(obj[key])
                        }
                    }
                    return newObj
                }

                return obj
            }

            // Apply deep sanitization to the entire record content
            const cleanContent = deepSanitize(record.content)

            const res = await generateGenericReport({
                patientName,
                professionalName,
                recordContent: cleanContent, // Pass sanitized content
                instructions: aiInstructions || "Gere um relatório completo da consulta.",
                templateTitle: record.form_templates?.title || 'Formulário'
            })

            if (res.success) {
                if (res.text || res.content) setContent(res.text || res.content)
                toast.success("Texto gerado com sucesso!")
            } else {
                toast.error(res.error || "Falha ao gerar relatório IA")
            }
        } catch (e) {
            console.error(e)
            toast.error("Erro inesperado.")
        } finally {
            setGenerating(false)
        }
    }

    const handleGeneratePDF = async () => {
        // [MODIFIED] Allow generating PDF even if content is empty (if we have visuals)
        const hasVisuals = radarData.length > 0 || dfiData.length > 0
        if (!content.trim() && !hasVisuals) {
            toast.error("O relatório precisa de conteúdo ou gráficos.")
            return
        }

        setLoading(true)
        try {
            const professionalNameFixed = professionalProfile?.full_name || professionalName;
            const variableMap: Record<string, string> = {
                'patient_name': patientName,
                'data_atual': new Date().toLocaleDateString('pt-BR'),
                'profissional_nome': professionalNameFixed,
                'profissional_registro': professionalProfile?.registry || '',
                'profissional_especialidade': professionalProfile?.specialty || 'Fisioterapeuta',
                'profissional_telefone': professionalProfile?.phone || '',
                'profissional_email': professionalProfile?.email || '',
                'financeiro_mes_extenso': monthlyStats.monthName,
                'financeiro_ano': monthlyStats.year,
                'financeiro_qtd_atendimentos': `${monthlyStats.count} (${monthlyStats.countWords})`,
                'financeiro_valor_sessao': new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyStats.unitValue),
                'financeiro_valor_total': new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyStats.total),
                'financeiro_lista_datas': monthlyStats.dates.join(', '),
            }

            const blob = await pdf(
                <ReportPdf
                    title={selectedTemplate ? (REPORT_TEMPLATES.find(t => t.id === selectedTemplate)?.title || reportTemplates.find(t => t.id === selectedTemplate)?.title || 'Relatório') : 'Relatório Personalizado'}
                    content={content}
                    patientName={patientName}
                    professionalName={professionalNameFixed}
                    professionalSpecialty={professionalProfile?.specialty}
                    professionalRegistry={professionalProfile?.registry}
                    date={format(new Date(), "dd/MM/yyyy HH:mm")}
                    variableMap={variableMap}
                    radarData={radarData}
                    dfiData={dfiData}
                    // Rich Data Props
                    mainComplaint={extraData.mainComplaint}
                    painLevel={extraData.painLevel}
                    painDuration={extraData.painDuration}
                    painMapData={extraData.painMapData}
                    shoeInfo={extraData.shoeInfo}
                    examImages={extraData.examImages}
                />
            ).toBlob()

            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `Relatorio_${patientName.replace(/\s+/g, '_')}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            toast.success("PDF baixado com sucesso!")
        } catch (error) {
            console.error(error)
            toast.error("Erro ao gerar PDF.")
        } finally {
            setLoading(false)
        }
    }

    const handleSend = async () => {
        if (!content.trim()) {
            toast.error("O conteúdo do relatório não pode estar vazio.")
            return
        }

        setLoading(true)
        try {
            const result = await sendReportViaWhatsapp({
                patientId,
                content,
                reportType: REPORT_TEMPLATES.find(t => t.id === selectedTemplate)?.title || reportTemplates.find(t => t.id === selectedTemplate)?.title || 'Relatório',
                slug
            })

            if (result.success) {
                toast.success("Relatório enviado com sucesso via WhatsApp!")
            } else {
                toast.error(result.error || "Erro ao enviar relatório.")
            }
        } catch (error) {
            console.error(error)
            toast.error("Erro inesperado ao enviar.")
        } finally {
            setLoading(false)
        }
    }

    const handleSaveToAttachments = async () => {
        const hasVisuals = radarData.length > 0 || dfiData.length > 0
        if (!content.trim() && !hasVisuals) {
            toast.error("O relatório precisa de conteúdo ou gráficos.")
            return
        }

        setLoading(true)
        try {
            const professionalNameFixed = professionalProfile?.full_name || professionalName;
            const variableMap: Record<string, string> = {
                'patient_name': patientName,
                'data_atual': new Date().toLocaleDateString('pt-BR'),
                'profissional_nome': professionalNameFixed,
                'profissional_registro': professionalProfile?.registry || '',
                'profissional_especialidade': professionalProfile?.specialty || 'Fisioterapeuta',
            }

            const blob = await pdf(
                <ReportPdf
                    title={selectedTemplate ? (REPORT_TEMPLATES.find(t => t.id === selectedTemplate)?.title || reportTemplates.find(t => t.id === selectedTemplate)?.title || 'Relatório') : 'Relatório Personalizado'}
                    content={content}
                    patientName={patientName}
                    professionalName={professionalNameFixed}
                    professionalSpecialty={professionalProfile?.specialty}
                    professionalRegistry={professionalProfile?.registry}
                    date={format(new Date(), "dd/MM/yyyy HH:mm")}
                    variableMap={variableMap}
                    radarData={radarData}
                    dfiData={dfiData}
                    mainComplaint={extraData.mainComplaint}
                    painLevel={extraData.painLevel}
                    painDuration={extraData.painDuration}
                    painMapData={extraData.painMapData}
                    shoeInfo={extraData.shoeInfo}
                    examImages={extraData.examImages}
                />
            ).toBlob()

            const fileName = `Relatorio_${patientName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`
            const file = new File([blob], fileName, { type: 'application/pdf' })

            const formData = new FormData()
            formData.append('patient_id', patientId)
            formData.append('title', selectedTemplate ? (REPORT_TEMPLATES.find(t => t.id === selectedTemplate)?.title || reportTemplates.find(t => t.id === selectedTemplate)?.title || 'Relatório') : 'Relatório Gerado')
            formData.append('file', file)

            const result = await uploadPatientDocument(formData)

            if (result.success) {
                toast.success("Relatório salvo nos Anexos com sucesso!")
            } else {
                toast.error(result.error || "Erro ao salvar relatório.")
            }
        } catch (error) {
            console.error(error)
            toast.error("Erro ao salvar nos anexos.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1 space-y-6">

                {/* [NEW] AI Generation Card */}
                <Card className="border-indigo-100 bg-indigo-50/50">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2 text-indigo-700">
                            <Sparkles className="h-5 w-5" />
                            <CardTitle className="text-base">Mágica (IA)</CardTitle>
                        </div>
                        <CardDescription>Crie relatórios automáticos baseados nos formulários.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase">1. Base de Dados (Formulário)</Label>

                            {/* Debugging Button */}
                            {records && records.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-full text-[10px] text-muted-foreground mb-1 justify-start"
                                    onClick={() => setSelectedRecordId(records[0].id)}
                                >
                                    [Debug] Selecionar 1º: {records[0].form_templates?.title}
                                </Button>
                            )}

                            <select
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedRecordId}
                                onChange={(e) => setSelectedRecordId(e.target.value)}
                            >
                                <option value="" disabled>Selecione um formulário...</option>
                                {records && records.length > 0 ? records.map(r => (
                                    <option key={r.id} value={r.id}>
                                        {r.form_templates?.title || 'Sem título'} - {format(new Date(r.created_at), 'dd/MM HH:mm')}
                                    </option>
                                )) : <option value="none" disabled>Nenhum formulário preenchido</option>}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase">2. Instruções para IA</Label>
                            <Textarea
                                placeholder="Ex: Foque na melhora do joelho e sugira exercícios."
                                className="bg-white text-sm h-20 resize-none"
                                value={aiInstructions}
                                onChange={e => setAiInstructions(e.target.value)}
                            />
                        </div>

                        <Button
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                            onClick={handleGenerateAI}
                            disabled={generating || !selectedRecordId}
                        >
                            {generating ? <Sparkles className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                            Gerar Relatório Inteligente
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Modelos Prontos</CardTitle>
                        <CardDescription>Ou use um modelo padrão.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Tipo de Documento</Label>
                            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {REPORT_TEMPLATES.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                    ))}
                                    {reportTemplates.length > 0 && <div className="h-px bg-muted my-1" />}
                                    {reportTemplates.filter(rt => !REPORT_TEMPLATES.some(lt => lt.title === rt.title)).map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* [NEW] Month Selector for Billing Reports */}
                        {(selectedTemplate === 'relatorio_reembolso' || content.includes('financeiro_')) && (
                            <div className="space-y-2 pt-2 border-t mt-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase">Mês de Referência</Label>
                                <Input
                                    type="month"
                                    value={billingMonth}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBillingMonth(e.target.value)}
                                    className="bg-white"
                                />
                                <div className="p-2 bg-blue-50 rounded text-[10px] text-blue-700 space-y-1">
                                    <p><b>Sessões:</b> {monthlyStats.count}</p>
                                    <p><b>Valor:</b> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyStats.total)}</p>
                                    <p><b>Datas:</b> {monthlyStats.dates.join(', ')}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Ações</CardTitle>
                        <CardDescription>O que deseja fazer com este documento?</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button
                            className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white gap-2"
                            onClick={handleSend}
                            disabled={loading || !content}
                        >
                            {loading ? <CheckCircle className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
                            Enviar via WhatsApp
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full gap-2"
                            disabled={loading || (!content && radarData.length === 0 && dfiData.length === 0)}
                            onClick={handleGeneratePDF}
                        >
                            <FileText className="h-4 w-4" />
                            Gerar PDF
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                            disabled={loading || (!content && radarData.length === 0 && dfiData.length === 0)}
                            onClick={handleSaveToAttachments}
                        >
                            <Save className="h-4 w-4" />
                            Salvar nos Anexos
                        </Button>

                        {/* [NEW] Smart Report V2 Button */}
                        <Button
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white gap-2 shadow-md border-0"
                            disabled={!selectedRecordId}
                            onClick={() => {
                                if (selectedRecordId) {
                                    window.open(`/reports/viewer/${selectedRecordId}`, '_blank')
                                } else {
                                    toast.error("Selecione um formulário primeiro.")
                                }
                            }}
                        >
                            <Sparkles className="h-4 w-4" />
                            Gerar Laudo Inteligente (V2)
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="md:col-span-2">
                <Card className="h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>Conteúdo do Documento</CardTitle>
                        <CardDescription>Edite o texto conforme necessário antes de emitir o atestado ou declaração.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-[600px] flex flex-col p-0 border-t">
                        <RichTextEditor
                            content={content}
                            onChange={setContent}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
