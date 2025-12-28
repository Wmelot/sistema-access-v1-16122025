'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Send, FileText, CheckCircle, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { sendReportViaWhatsapp } from '../actions/reports'

interface PatientReportsTabProps {
    patientId: string
    patientName: string
    professionalName?: string
}

// Predefined Templates
const REPORT_TEMPLATES = [
    {
        id: 'atestado_comparecimento',
        title: 'Atestado de Comparecimento',
        content: `ATESTADO DE COMPARECIMENTO\n\nAtesto para os devidos fins que o(a) Sr(a). {{PACIENTE}} compareceu a este serviço de fisioterapia na data de hoje, {{DATA}}, no horário de {{HORARIO}}, para realização de tratamento fisioterapêutico.\n\n{{PROFISSIONAL}}\nFisioterapeuta`
    },
    {
        id: 'declaracao_acompanhamento',
        title: 'Declaração de Acompanhamento',
        content: `DECLARAÇÃO\n\nDeclaro que o(a) Sr(a). {{PACIENTE}} encontra-se em tratamento fisioterapêutico sob meus cuidados, necessitando de acompanhamento regular.\n\nAtenciosamente,\n\n{{PROFISSIONAL}}\nFisioterapeuta`
    },
    {
        id: 'encaminhamento',
        title: 'Encaminhamento',
        content: `ENCAMINHAMENTO\n\nAo(A) Dr(a). Especialista,\n\nEncaminho o(a) paciente {{PACIENTE}} para avaliação e conduta, apresentando quadro de [DESCREVER QUADRO].\n\nSigo à disposição para discussão do caso.\n\nAtenciosamente,\n\n{{PROFISSIONAL}}\nFisioterapeuta`
    },
    {
        id: 'relatorio_evolucao',
        title: 'Relatório de Evolução',
        content: `RELATÓRIO DE EVOLUÇÃO\n\nPaciente: {{PACIENTE}}\nData: {{DATA}}\n\nPaciente vem apresentando evolução [SATISFATÓRIA/ESTÁVEL] ao tratamento proposto. Observa-se melhora na amplitude de movimento e redução do quadro álgico.\n\nPlano terapêutico mantido.\n\n{{PROFISSIONAL}}\nFisioterapeuta`
    }
]

export function PatientReportsTab({ patientId, patientName, professionalName = "Fisioterapeuta" }: PatientReportsTabProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<string>('')
    const [content, setContent] = useState<string>('')
    const [loading, setLoading] = useState(false)

    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplate(templateId)
        const template = REPORT_TEMPLATES.find(t => t.id === templateId)
        if (template) {
            // Auto-fill variables
            const now = new Date()
            const dateStr = now.toLocaleDateString('pt-BR')
            const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

            const filledContent = template.content
                .replace(/{{PACIENTE}}/g, patientName)
                .replace(/{{DATA}}/g, dateStr)
                .replace(/{{HORARIO}}/g, timeStr)
                .replace(/{{PROFISSIONAL}}/g, professionalName)

            setContent(filledContent)
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
                <Card>
                    <CardHeader>
                        <CardTitle>Modelos</CardTitle>
                        <CardDescription>Selecione um modelo de documento.</CardDescription>
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
                        <Button variant="outline" className="w-full gap-2" disabled={!content}>
                            <FileText className="h-4 w-4" />
                            Gerar PDF (Em breve)
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
                            className="h-[400px] font-mono text-sm leading-relaxed p-4"
                            placeholder="Selecione um modelo para começar ou digite aqui..."
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
