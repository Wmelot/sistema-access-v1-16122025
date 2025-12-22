import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Printer, Mail, Download, ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import parse from 'html-react-parser'
import { createClient } from "@/lib/supabase/client"
import { RadarChart } from "@/components/charts/radar-chart"
import { calculateMetric } from "@/lib/utils/metric-calculator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface ReportViewerProps {
    template: any
    data: any // Patient, Appointment, Record data mixed
    onClose?: () => void
}

export function ReportViewer({ template, data, onClose }: ReportViewerProps) {
    const printRef = useRef<HTMLDivElement>(null)
    const [rawContent, setRawContent] = useState("")
    const [chartsMeta, setChartsMeta] = useState<any[]>([])
    const [metricsMeta, setMetricsMeta] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const [logoUrl, setLogoUrl] = useState("/logo_login.png") // Fallback to existing logo

    // 1. Fetch Metadata (Charts, Metrics & Settings)
    useEffect(() => {
        const fetchMeta = async () => {
            const supabase = createClient()
            const [chartsRes, metricsRes, settingsRes] = await Promise.all([
                supabase.from('chart_templates').select('*'),
                supabase.from('form_metrics').select('*'),
                supabase.from('clinic_settings').select('document_logo_url').single()
            ])

            if (chartsRes.data) setChartsMeta(chartsRes.data)
            if (metricsRes.data) setMetricsMeta(metricsRes.data)
            if (settingsRes.data && settingsRes.data.document_logo_url) {
                // Check if it's a storage path or full URL
                const url = settingsRes.data.document_logo_url
                if (!url.startsWith('http') && !url.startsWith('/')) {
                    // Get public URL from storage
                    const { data } = supabase.storage.from('documents').getPublicUrl(url)
                    setLogoUrl(data.publicUrl)
                } else {
                    setLogoUrl(url)
                }
            }
            setLoading(false)
        }
        fetchMeta()
    }, [])

    // 2. Process Template Content
    useEffect(() => {
        if (!template) return

        let finalContent = ""

        if (template.type === 'standard') {
            const fields = template.config?.selectedFields || []
            finalContent += `<div class="report-standard">`
            finalContent += `<div class="text-center mb-6"><img src="${logoUrl}" alt="Logo" class="h-16 mx-auto" /></div>`
            finalContent += `<h1 class="text-2xl font-bold mb-4 text-center border-b pb-2">${template.title}</h1>`

            // Header Info
            finalContent += `
             <div class="mb-6 grid grid-cols-2 gap-4 text-sm">
                 <div><strong>Paciente:</strong> ${data.patient?.name || 'N/A'}</div>
                 <div><strong>Data:</strong> ${format(new Date(), "dd/MM/yyyy", { locale: ptBR })}</div>
                 <div><strong>Profissional:</strong> ${data.professional_name || 'N/A'}</div>
             </div>
         `

            fields.forEach((field: any) => {
                const value = data.record?.form_data?.[field.originalId] || ''
                let displayValue = value
                if (Array.isArray(value)) displayValue = value.join(", ")
                if (typeof value === 'boolean') displayValue = value ? 'Sim' : 'Não'

                finalContent += `
                    <div class="mb-4">
                        <div class="font-bold text-sm text-gray-700">${field.label}</div>
                        <div class="p-2 bg-gray-50 rounded border border-gray-100 min-h-[2rem] whitespace-pre-wrap">${displayValue}</div>
                    </div>
                `
            })
            finalContent += `</div>`

        } else {
            // Certificate / Custom
            let text = template.config?.content || ""
            const replacements: Record<string, string> = {
                '{paciente_nome}': data.patient?.name || '',
                '{paciente_cpf}': data.patient?.cpf || '',
                '{data_atual}': format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
                '{hora_inicio}': data.appointment?.start_time ? format(new Date(data.appointment.start_time), 'HH:mm') : '',
                '{hora_fim}': data.appointment?.end_time ? format(new Date(data.appointment.end_time), 'HH:mm') : '',
                '{agendamento_data}': data.appointment?.start_time ? format(new Date(data.appointment.start_time), 'dd/MM/yyyy') : '',
                '{agendamento_horario}': data.appointment?.start_time ? format(new Date(data.appointment.start_time), 'HH:mm') : '',
                '{agendamento_procedimento}': data.appointment?.service_name || 'Atendimento',
                '{cidade_clinica}': 'Belo Horizonte',
                '{estado_clinica}': 'MG',
                '{profissional_nome}': data.professional_name || '',
                '{profissional_registro}': data.professional_registry || '',
                '{profissional_especialidade}': data.professional_specialty || 'Fisioterapeuta',
                '{cid}': data.record?.cid || '',
            }

            Object.entries(replacements).forEach(([key, val]) => {
                const safeKey = key.replace(/{/g, '\\{').replace(/}/g, '\\}')
                const regex = new RegExp(safeKey, 'g')
                text = text.replace(regex, val)
            })

            finalContent = `
                <div class="report-document font-serif text-lg leading-relaxed p-8">
                    ${template.config.showLogo ? `<div class="text-center mb-8"><img src="${logoUrl}" alt="Logo" class="h-16 mx-auto" /></div>` : ''}
                    <h1 class="text-2xl font-bold mb-8 text-center uppercase">${template.title}</h1>
                    <div class="content mb-12 whitespace-pre-wrap">${text}</div>
                    ${template.config.showSignature ?
                    `<div class="mt-20 text-center">
                            <div class="border-t border-black w-64 mx-auto pt-2"></div>
                            <div class="font-bold">${data.professional_name || 'Assinatura do Profissional'}</div>
                            <div class="text-sm text-gray-600">Fisioterapeuta</div>
                         </div>`
                    : ''}
                </div>
            `
        }

        setRawContent(finalContent)
    }, [template, data, logoUrl])

    // 3. Logic to Render Charts inside HTML
    const parsedContent = parse(rawContent, {
        replace: (domNode: any) => {
            if (domNode.name === 'report-chart') {
                const chartId = domNode.attribs['chart-id']
                const chartTemplate = chartsMeta.find(c => c.id === chartId)
                if (!chartTemplate) return <div className="text-red-500 text-sm p-2 bg-red-50">[Gráfico não encontrado]</div>

                // Calculate Data
                const chartData = (chartTemplate.config?.axes || []).map((axis: any) => {
                    const metric = metricsMeta.find(m => m.id === axis.metricId)
                    let value = 0
                    if (metric) {
                        value = calculateMetric(metric, data.record?.form_data || {})
                    }
                    return { subject: axis.label, value: value, fullMark: 10 }
                })

                return (
                    <div className="my-8 flex justify-center w-full chart-container" data-chart-id={chartId}>
                        <RadarChart data={chartData} width={500} height={350} />
                    </div>
                )
            }
        }
    })

    const handlePrint = () => {
        if (!printRef.current) return
        const printContent = printRef.current.innerHTML
        const printWindow = window.open('', '', 'width=800,height=600')
        if (!printWindow) {
            toast.error("Pop-up bloqueado. Permita pop-ups para imprimir.")
            return
        }

        printWindow.document.write(`
            <html>
                <head>
                    <title>${template.title} - ${data.patient?.name}</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        body { padding: 20px; -webkit-print-color-adjust: exact; }
                        @media print { .no-print { display: none; } }
                    </style>
                </head>
                <body>
                    <div id="print-root">${printContent}</div>
                     <script>
                        setTimeout(() => { window.print(); }, 1000);
                    </script>
                </body>
            </html>
        `)
        printWindow.document.close()
    }

    if (loading) return null

    // USE SHADCN DIALOG
    return (
        <Dialog open={true} onOpenChange={(open) => { if (!open && onClose) onClose() }}>
            <DialogContent className="max-w-[900px] h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-4 border-b flex-shrink-0">
                    <div className="flex items-center justify-between w-full">
                        <DialogTitle className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => onClose?.()} className="-ml-2">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            Visualizar Impressão
                        </DialogTitle>
                        <Button onClick={handlePrint} size="sm">
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimir / PDF
                        </Button>
                    </div>
                    <DialogDescription className="sr-only">Visualização do documento antes da impressão</DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto bg-slate-100 p-8 min-h-0">
                    <div
                        ref={printRef}
                        className="bg-white shadow-xl mx-auto max-w-[210mm] min-h-[297mm] p-[20mm] text-black"
                    >
                        {parsedContent}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
