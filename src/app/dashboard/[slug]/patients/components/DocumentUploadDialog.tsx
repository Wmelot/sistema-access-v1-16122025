'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Loader2, FileText } from "lucide-react"
import { toast } from "sonner"
import { uploadPatientDocument } from "@/actions/documents"

interface DocumentUploadDialogProps {
    patientId: string
    onSuccess?: () => void
    children?: React.ReactNode
}

export function DocumentUploadDialog({ patientId, onSuccess, children }: DocumentUploadDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [fileName, setFileName] = useState<string>('')

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        try {
            // Append patientId if not present (though using hidden input is better)
            formData.append('patient_id', patientId)

            const result = await uploadPatientDocument(formData)

            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success("Documento salvo com sucesso!")
                setOpen(false)
                if (onSuccess) onSuccess()
            }
        } catch (error) {
            toast.error("Erro inesperado ao enviar.")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline" className="gap-2">
                        <Upload className="h-4 w-4" />
                        Upload
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Anexar Documento</DialogTitle>
                    <DialogDescription>
                        Envie PDFs, imagens ou laudos externos.
                    </DialogDescription>
                </DialogHeader>

                <form action={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Título do Documento</Label>
                        <Input
                            id="title"
                            name="title"
                            placeholder="Ex: Ressonância Magnética, Encaminhamento..."
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="file">Arquivo</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="file"
                                name="file"
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                required
                                className="cursor-pointer"
                                onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
                            />
                        </div>
                        {fileName && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {fileName}
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Documento
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
