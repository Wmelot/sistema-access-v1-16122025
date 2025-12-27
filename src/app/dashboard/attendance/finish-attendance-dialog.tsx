"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, DollarSign, FileText, Calendar as CalendarIcon, Printer, Clock } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import { createInvoice, getProducts } from "@/app/dashboard/patients/actions" // Re-use logic
import { createAppointment } from "@/app/dashboard/schedule/actions"
import { getServices } from "@/app/dashboard/services/actions" // [LOAD SERVICES]
import { CurrencyInput } from "@/components/ui/currency-input"
import { getAvailableSlots } from "@/app/dashboard/schedule/actions"
import { getReportTemplates } from "@/app/dashboard/settings/reports/actions"
import { ReportViewer } from "@/components/reports/ReportViewer" // [NEW]
import { PhysicalAssessmentReportPrint } from "@/components/assessments/physical-assessment-report-print" // [NEW]

interface FinishAttendanceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    appointment: any
    patient: any
    recordId?: string
    onConfirm: () => void
    paymentMethods?: any[]
    professionals?: any[]
}

export function FinishAttendanceDialog({ open, onOpenChange, appointment, patient, recordId, onConfirm, paymentMethods = [], professionals = [] }: FinishAttendanceDialogProps) {
    const [step, setStep] = useState<"finance" | "report" | "schedule">("finance")

    // Report State
    const [templates, setTemplates] = useState<any[]>([])
    const [viewingTemplate, setViewingTemplate] = useState<any>(null)
    const [viewingPhysicalReport, setViewingPhysicalReport] = useState<any>(null) // [NEW]
    const [fullRecord, setFullRecord] = useState<any>(null)

    // Fetch Record Data if recordId exists
    useEffect(() => {
        if (!recordId) return
        const fetchRecord = async () => {
            const { createClient } = await import("@/lib/supabase/client")
            const supabase = createClient()
            const { data } = await supabase.from('patient_records').select('*').eq('id', recordId).single()
            if (data) setFullRecord(data)
        }
        fetchRecord()
    }, [recordId])

    // Fetch Templates on Mount
    useEffect(() => {
        getReportTemplates().then(setTemplates)
    }, [])

    // [NEW] Combined Templates (Standard + Dynamic Physical Report)
    const availableReports = useMemo(() => {
        const list = [...templates]
        // Check if we have a Physical Assessment Report in the record
        if (fullRecord?.content?.aiReport) {
            list.unshift({
                id: 'physical-assessment-report',
                title: 'Relatório de Avaliação Física',
                type: 'physical_assessment', // Special type
                is_dynamic: true,
                content: fullRecord.content.aiReport // Pass data directly
            })
        }
        return list
    }, [templates, fullRecord])

    const handleReportSelect = (template: any) => {
        if (template.type === 'physical_assessment') {
            setViewingPhysicalReport(template.content)
        } else {
            setViewingTemplate(template)
        }
    }

    // ... (rest of finance/schedule logic unchanged) ...

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                {/* ... Dialog Content ... */}
                {/* Step 2: Report */}
                {step === 'report' && (
                    <div className="space-y-4 py-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="text-center py-2">
                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                            <h3 className="text-lg font-bold text-slate-800">Atendimento Registrado!</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1">
                            {availableReports.map(template => ( // [MODIFIED] Use availableReports
                                <div
                                    key={template.id}
                                    className={`border rounded-lg p-3 hover:bg-muted/50 cursor-pointer flex flex-col gap-2 transition-colors text-left ${template.is_dynamic ? 'bg-blue-50 border-blue-200' : ''}`}
                                    onClick={() => handleReportSelect(template)}
                                >
                                    <div className="font-medium flex items-center gap-2">
                                        <FileText className={`h-4 w-4 ${template.is_dynamic ? 'text-blue-600' : 'text-primary'}`} />
                                        {template.title}
                                    </div>
                                    <div className="text-xs text-muted-foreground uppercase">
                                        {template.type === 'standard' ? 'Relatório' :
                                            template.type === 'certificate' ? 'Atestado' :
                                                template.type === 'physical_assessment' ? 'Avaliação IA' : 'Outro'}
                                    </div>
                                </div>
                            ))}
                            {availableReports.length === 0 && (
                                <div className="col-span-2 text-center text-muted-foreground py-8 border rounded-lg border-dashed">
                                    Nenhum modelo de relatório encontrado.
                                    <br />
                                    <span className="text-xs">Configure em Configurações &gt; Relatórios.</span>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => setStep('schedule')}>
                                Pular / Próximo
                            </Button>
                        </div>
                    </div>
                )}
                {/* ... End Step 2 ... */}
            </Dialog>

            {/* STANDARD VIEWER */}
            {viewingTemplate && (
                <ReportViewer
                    template={viewingTemplate}
                    data={{
                        patient,
                        appointment,
                        professional_name: professionals.find(p => p.id === appointment.professional_id)?.name || 'Profissional',
                        record: {
                            cid: fullRecord?.cid || '',
                            form_data: fullRecord?.content || {}
                        }
                    }}
                    onClose={() => setViewingTemplate(null)}
                />
            )}

            {/* [NEW] PHYSICAL REPORT VIEWER */}
            {viewingPhysicalReport && (
                <Dialog open={true} onOpenChange={() => setViewingPhysicalReport(null)}>
                    <DialogContent className="max-w-[900px] h-[90vh] flex flex-col p-0 gap-0">
                        <div className="flex-1 overflow-y-auto bg-slate-100 p-8">
                            <PhysicalAssessmentReportPrint report={viewingPhysicalReport} />
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    )
}


