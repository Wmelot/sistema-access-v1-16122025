'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Send, FileText, CheckCircle, Smartphone, Sparkles, Bot } from 'lucide-react'
import { toast } from 'sonner'
import { sendReportViaWhatsapp } from '../actions/reports'
import { generateGenericReport } from '@/app/dashboard/reports/ai-actions'
import { format } from 'date-fns'
import { pdf } from '@react-pdf/renderer'
import { ReportPdf } from '@/components/reports/ReportPdf'

interface PatientReportsTabProps {
    patientId: string
    patientName: string
    professionalName?: string
    records?: any[]
}

// [CONFIG] Preset Generation Scripts (Prompts)
// You can edit these scripts to customize how the AI generates reports for specific form types.
const PRESET_PROMPTS: Record<string, string> = {
    'Palmilha': `
            Gere um Laudo de Avaliação de Palmilhas Biomecânicas altamente técnico e completo.
            Estrutura Obrigatória:
            1. **Análise Biomecânica**: Descreva o tipo de pisada (Cava/Plana/Neutra) e alinhamento do retropé (Valgo/Varo) com base nos dados.
            2. **Baropodometria**: Se houver dados de pressão, descreva os picos de pressão plantar.
            3. **Prescrição**: Detalhe os elementos da palmilha sugeridos (ex: Piloto, Arco Longitudinal, Barra Metatarsal).
            4. **Conclusão**: Justifique a necessidade da palmilha para a patologia do paciente.
            Use tom clínico ortopédico.
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
    }
]

export function PatientReportsTab({ patientId, patientName, professionalName = "Fisioterapeuta", records = [] }: PatientReportsTabProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<string>('')
    const [content, setContent] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [generating, setGenerating] = useState(false)

    // [DEBUG] Check records
    useEffect(() => {
        console.log('PatientReportsTab Records:', records)
        if (!records || records.length === 0) {
            console.warn('No records passed to PatientReportsTab')
        }
    }, [records])

    // [NEW] AI States
    const [selectedRecordId, setSelectedRecordId] = useState<string>('')
    const [aiInstructions, setAiInstructions] = useState<string>('')
    const [radarData, setRadarData] = useState<any[]>([])
    const [dfiData, setDfiData] = useState<any[]>([])
    const [extraData, setExtraData] = useState<any>({})

    // [HELPER] Extract Rich Data from Record
    const extractReportData = (record: any) => {
        if (!record || !record.content) return {}
        const data = record.content

        // ID Mappings from 'Consulta Palmilha' template
        const mapPoints = (points: any[], view: string) => points?.map((p: any) => ({ ...p, view })) || []

        const painPoints = [
            ...mapPoints(data['jws839roq']?.points, 'anterior'),
            ...mapPoints(data['nh49wopa0']?.points, 'posterior'),
            ...mapPoints(data['vr7fahfmp']?.points, 'feet'), // Left Foot
            ...mapPoints(data['l955ymtak']?.points, 'feet')  // Right Foot
        ]

        const shoeInfo = {
            weight: data['min_peso_v3'],
            drop: data['min_drop_v3'],
            stack: data['min_pilha_v3'],
            flexibility: data['min_flex_long_v3'], // Optional: could combine long/tor
            minimalismIndex: data['min_calc_index_v3']
        }

        // Handle File Uploads (Array of objects with url)
        const getFileUrl = (fieldId: string) => {
            const field = data[fieldId]
            if (Array.isArray(field) && field.length > 0) return field[0].url || field[0].preview
            return null
        }

        const examImages = {
            plantigraphy2D: getFileUrl('zpmpp93p9'),
            plantigraphy3D: getFileUrl('dfn6uakix')
        }

        // Extract Radar Data from Form Grid 'e4pg81lur' if available
        let formRadarData: any[] = []
        if (data['e4pg81lur']) {
            const grid = data['e4pg81lur']
            // Grid structure: { "0-0": "80", "1-0": "60" ... } where row-col
            // Rows: Dor, Estabilidade/Equilíbrio, Força, Flexibilidade, Função, Postura dos pés, Simetria
            const rows = ["Dor", "Estabilidade", "Força", "Flexibilidade", "Função", "Postura", "Simetria"]
            formRadarData = rows.map((subject, index) => {
                const val = grid[`${index}-0`]
                return {
                    subject,
                    A: parseInt(val) || 0,
                    fullMark: 100
                }
            }).filter(d => d.A > 0 || d.subject === "Dor") // Keep only meaningful data
        }

        // Extract DFI Data from Form Grid 'kjjtpwnys' if available
        let formDfiData: any[] = []
        if (data['kjjtpwnys']) {
            const grid = data['kjjtpwnys']
            // Rows: Contato Inicial, Resposta à carga, Impulsão
            // Cols: Pé Esquerdo (0), Pé Direito (1)
            const phases = ["Contato Inicial", "Resposta à Carga", "Impulsão"]
            formDfiData = phases.map((phase, index) => ({
                phase,
                left: grid[`${index}-0`] || '0',
                right: grid[`${index}-1`] || '0'
            }))
        }

        return {
            painMapData: painPoints,
            shoeInfo,
            examImages,
            painLevel: data['7gcx77p3o'], // EVA
            mainComplaint: data['mpju4cc13'], // QP
            painDuration: data['tuvq19frm'], // HMA
            formRadarData: formRadarData.length > 0 ? formRadarData : null,
            formDfiData: formDfiData.length > 0 ? formDfiData : null
        }
    }

    // [NEW] Intelligent Script Pre-filling
    useEffect(() => {
        if (!selectedRecordId) return

        const record = records?.find(r => r.id === selectedRecordId)
        if (record && record.form_templates) {
            const template = record.form_templates

            // 1. Check for Custom DB Script
            if (template.ai_generation_script) {
                setAiInstructions(template.ai_generation_script)
                toast.info("Script personalizado do formulário carregado!")
                return
            }

            // 2. Check for Presets (Partial Match)
            const title = template.title || ''
            const presetKey = Object.keys(PRESET_PROMPTS).find(key => title.includes(key) || key.includes(title))

            if (presetKey) {
                setAiInstructions(PRESET_PROMPTS[presetKey])
                toast.info(`Script de ${presetKey} carregado!`)
            } else {
                setAiInstructions("Gere um relatório detalhado da consulta.")
            }
        }
    }, [selectedRecordId, records])

    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplate(templateId)
        const template = REPORT_TEMPLATES.find(t => t.id === templateId)
        if (template) {
            // Auto-fill variables
            const now = new Date()
            const dateStr = now.toLocaleDateString('pt-BR')
            const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

            const filledContent = template.content
                .replace(/{{ PACIENTE }}/g, patientName)
                .replace(/{{ DATA }}/g, dateStr)
                .replace(/{{ HORARIO }}/g, timeStr)
                .replace(/{{ PROFISSIONAL }}/g, professionalName)

            setContent(filledContent)
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
            const res = await generateGenericReport({
                patientName,
                professionalName,
                recordContent: record.content, // Pass the JSON content
                instructions: aiInstructions || "Gere um relatório completo da consulta.",
                templateTitle: record.form_templates?.title || 'Formulário'
            })

            if (res.success) {
                if (res.text || res.content) setContent(res.text || res.content)
                // Extract Rich Data
                const extracted = extractReportData(record)
                setExtraData(extracted)

                // Prioritize Form Radar Data if available
                if (extracted.formRadarData) {
                    setRadarData(extracted.formRadarData)
                } else if (res.radarData) {
                    setRadarData(res.radarData)
                }

                if (res.dfiData) setDfiData(res.dfiData)

                toast.success("Relatório gerado com sucesso! ✨")
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
        if (!content.trim()) {
            toast.error("O conteúdo do relatório não pode estar vazio.")
            return
        }

        setLoading(true)
        try {
            const blob = await pdf(
                <ReportPdf
                    title={REPORT_TEMPLATES.find(t => t.id === selectedTemplate)?.title || 'Relatório'}
                    content={content}
                    patientName={patientName}
                    professionalName={professionalName}
                    date={new Date().toLocaleDateString('pt-BR')}
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
                reportType: REPORT_TEMPLATES.find(t => t.id === selectedTemplate)?.title || 'Relatório'
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
                                </SelectContent>
                            </Select>
                        </div>
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
                        <Button variant="outline" className="w-full gap-2" disabled={!content || loading} onClick={handleGeneratePDF}>
                            <FileText className="h-4 w-4" />
                            Gerar PDF
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="md:col-span-2">
                <Card className="h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>Conteúdo do Documento</CardTitle>
                        <CardDescription>Edite o texto conforme necessário antes de enviar.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="h-[600px] font-mono text-sm leading-relaxed p-4"
                            placeholder="O relatório gerado aparecerá aqui..."
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
