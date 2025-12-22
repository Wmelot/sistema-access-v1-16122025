
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FormRenderer } from "@/components/forms/FormRenderer"
import { format } from "date-fns"

interface ViewRecordDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    record: any
    templates: any[]
    patient: any
}

export function ViewRecordDialog({ open, onOpenChange, record, templates, patient }: ViewRecordDialogProps) {
    if (!record) return null

    const template = templates.find(t => t.id === record.template_id) || record.form_templates

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="px-6 py-4 border-b shrink-0">
                    <DialogTitle>
                        Histórico: {format(new Date(record.created_at), "dd/MM/yyyy HH:mm")}
                    </DialogTitle>
                    <DialogDescription>
                        {template?.title || "Registro sem modelo"}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden bg-slate-50/50 relative">
                    <ScrollArea className="h-full">
                        <div className="p-6 pb-20">
                            {template ? (
                                <FormRenderer
                                    recordId={record.id}
                                    template={template}
                                    initialContent={record.content}
                                    status="finalized" // Read-Only Mode
                                    patientId={patient.id}
                                    templateId={template.id}
                                    hideHeader={true}
                                />
                            ) : (
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
