'use client'

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Printer, Mail, Download, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ReportViewerProps {
    template: any
    data: any // Patient, Appointment, Record data mixed
    onClose?: () => void
}

export function ReportViewer({ template, data, onClose }: ReportViewerProps) {
    const printRef = useRef<HTMLDivElement>(null)
    const [content, setContent] = useState("")

    // Process Content on Mount
    useEffect(() => {
        if (!template) return

        let finalContent = ""

        if (template.type === 'standard') {
            // Build Dynamic HTML from selected fields
            const fields = template.config?.selectedFields || []

            finalContent += `<div class="report-standard">`
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
                // Find value in data.record.form_data
                // Use field.originalId
                const value = data.record?.form_data?.[field.originalId] || ''

                // Format based on type (simple for now)
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

        } else if (template.type === 'certificate' || template.type === 'gym_auth' || template.type === 'counter') {
            // Replace variables in text
            let text = template.config?.content || ""

            const replacements: Record<string, string> = {
                '{paciente_nome}': data.patient?.name || '',
                '{paciente_cpf}': data.patient?.cpf || '',
                '{data_atual}': format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
                '{hora_inicio}': data.appointment?.start_time || '',
                '{hora_fim}': data.appointment?.end_time || '',
                '{cid}': data.record?.cid || '',
            }

            // Replace all occurrences
            Object.entries(replacements).forEach(([key, val]) => {
                const regex = new RegExp(key, 'g')
                text = text.replace(regex, val)
            })

            finalContent = `
                <div class="report-document font-serif text-lg leading-relaxed p-8">
                    ${template.config.showLogo ? '<div class="text-center mb-8"><img src="/logo-full.png" alt="Logo" class="h-16 mx-auto" /></div>' : ''}
                    <h1 class="text-2xl font-bold mb-8 text-center uppercase">${template.title}</h1>
                    <div class="content mb-12 whitespace-pre-wrap">${text}</div>
                    ${template.config.showSignature ?
                    `<div class="mt-20 text-center">
                            <div class="border-t border-black w-64 mx-auto pt-2"></div>
                            ${data.professional_name || 'Assinatura do Profissional'}
                         </div>`
                    : ''}
                </div>
            `
        }

        setContent(finalContent)
    }, [template, data])

    const handlePrint = () => {
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
                        @media print {
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    ${content}
                    <script>
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 500);
                    </script>
                </body>
            </html>
        `)
        printWindow.document.close()
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-bold flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={onClose} >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        Visualizar Impressão
                    </h3>
                    <div className="flex gap-2">
                        <Button onClick={handlePrint}>
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimir / PDF
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-gray-100 p-8">
                    <div
                        ref={printRef}
                        className="bg-white shadow-xl mx-auto max-w-[210mm] min-h-[297mm] p-[20mm] text-black"
                        dangerouslySetInnerHTML={{ __html: content }}
                    />
                </div>
            </div>
        </div>
    )
}
