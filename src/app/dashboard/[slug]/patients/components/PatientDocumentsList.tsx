'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Download, Trash2, Eye, Calendar, HardDrive } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { deletePatientDocument } from "@/actions/documents"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Document {
    id: string
    title: string
    url: string // Storage path
    signedUrl?: string // Public/Signed URL for display
    created_at: string
    size_bytes?: number
    type?: string
}

interface PatientDocumentsListProps {
    documents: Document[]
}

export function PatientDocumentsList({ documents }: PatientDocumentsListProps) {

    async function handleDelete(id: string) {
        const result = await deletePatientDocument(id)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success("Documento excluído.")
        }
    }

    if (!documents || documents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-lg bg-gray-50">
                <div className="p-3 mb-4 bg-gray-100 rounded-full">
                    <HardDrive className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">Nenhum arquivo</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Nenhum documento anexado a este paciente.
                </p>
            </div>
        )
    }

    const formatSize = (bytes?: number) => {
        if (!bytes) return ''
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
                <Card key={doc.id} className="overflow-hidden group hover:border-blue-200 transition-colors">
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-medium text-sm truncate" title={doc.title}>
                                        {doc.title}
                                    </h4>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {format(new Date(doc.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="text-xs text-muted-foreground mb-4 pl-[3.25rem]">
                            {doc.type?.split('/')[1]?.toUpperCase() || 'ARQUIVO'} • {formatSize(doc.size_bytes)}
                        </div>

                        <div className="flex items-center gap-2 pl-[3.25rem]">
                            <Button variant="outline" size="sm" className="h-8 flex-1" asChild>
                                <a href={doc.signedUrl} target="_blank" rel="noopener noreferrer">
                                    <Eye className="mr-2 h-3.5 w-3.5" />
                                    Abrir
                                </a>
                            </Button>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta ação não pode ser desfeita. O arquivo será removido permanentemente.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(doc.id)} className="bg-red-600 hover:bg-red-700">
                                            Excluir
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
