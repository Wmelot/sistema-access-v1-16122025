
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FormRenderer } from "@/components/forms/FormRenderer"
import { format } from "date-fns"
import { ASSESSMENTS } from "@/app/dashboard/patients/components/assessments/definitions"
import { Badge } from "@/components/ui/badge"
import { BiomechanicsReportPrint } from "@/components/assessments/biomechanics-report-print"

interface ViewRecordDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    record: any
    templates: any[]
    patient: any
}

export function ViewRecordDialog({ open, onOpenChange, record, templates, patient }: ViewRecordDialogProps) {
    if (!record) return null

    // 1. Try finding in database templates (FormBuilder)
    const dbTemplate = templates.find(t => t.id === record.template_id) || record.form_templates

    // 2. Try finding in static assessments (Clinical Scales)
    const clinicalAssessment = Object.values(ASSESSMENTS).find(a => a.id === record.template_id)

    const title = dbTemplate?.title || clinicalAssessment?.title || "Registro sem modelo"

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="px-6 py-4 border-b shrink-0">
                    <DialogTitle>
                        Histórico: {format(new Date(record.created_at), "dd/MM/yyyy HH:mm")}
                    </DialogTitle>
                    <DialogDescription>
                        {title}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden bg-slate-50/50 relative">
                    <ScrollArea className="h-full">
                        <div className="p-6 pb-20">
                            {clinicalAssessment ? (
                                // --- CUSTOM RENDERER FOR CLINICAL ASSESSMENTS ---
                                <div className="space-y-6 max-w-3xl mx-auto">
                                    <div className="bg-white p-6 rounded-lg border shadow-sm">
                                        <h3 className="font-semibold text-lg mb-4 text-slate-800 border-b pb-2">Respostas do Questionário</h3>
                                        <div className="space-y-4">
                                            {clinicalAssessment.questions.map((q: any) => {
                                                const answer = record.content[q.id];
                                                // Find label if available
                                                let displayAnswer = answer;
                                                if (q.options) {
                                                    const opt = q.options.find((o: any) => o.value === answer);
                                                    if (opt) displayAnswer = `${opt.label} (${answer})`;
                                                }
                                                // Skip unanswered if desired, or show "-"
                                                if (answer === undefined || answer === null) return null;

                                                return (
                                                    <div key={q.id} className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 py-2 border-b last:border-0 items-start">
                                                        <div className="text-sm text-slate-600 font-medium">{q.text}</div>
                                                        <Badge variant="secondary" className="text-sm font-bold shrink-0">
                                                            {String(displayAnswer)}
                                                        </Badge>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Show Scores if available */}
                                    {record.content._metadata?.scores && (
                                        <div className="bg-slate-100 p-4 rounded-lg border">
                                            <h4 className="font-medium mb-2">Resultados Calculados</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(record.content._metadata.scores).map(([k, v]) => {
                                                    if (k === 'riskColor') return null;
                                                    return (
                                                        <Badge key={k} variant="outline" className="bg-white">
                                                            {k}: {String(v)}
                                                        </Badge>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (dbTemplate?.title?.includes('Palmilha') || record.content?.shoeSize !== undefined) ? (
                                // --- BIOMECHANICS REPORT ---
                                <div className="bg-white min-h-screen">
                                    <BiomechanicsReportPrint
                                        data={record.content}
                                        patient={patient}
                                        date={record.created_at}
                                    />
                                </div>
                            ) : dbTemplate ? (
                                // --- STANDARD FORM RENDERER ---
                                <FormRenderer
                                    recordId={record.id}
                                    template={dbTemplate}
                                    initialContent={record.content}
                                    status="finalized" // Read-Only Mode
                                    patientId={patient.id}
                                    templateId={dbTemplate.id}
                                    hideHeader={true}
                                />
                            ) : (
                                // --- FALLBACK RAW DATA ---
                                <div className="space-y-4">
                                    <p className="text-muted-foreground">Modelo não encontrado. Exibindo dados brutos:</p>
                                    <pre className="p-4 bg-muted rounded-md text-xs overflow-auto">
                                        {JSON.stringify(record.content, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    )
}
