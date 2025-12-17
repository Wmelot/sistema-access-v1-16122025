'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { FileText, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { logAction } from '@/lib/logger'

interface NewEvaluationDialogProps {
    patientId: string
    patientName: string
    open?: boolean
    onOpenChange?: (open: boolean) => void
    children?: React.ReactNode // Custom trigger
    noTrigger?: boolean // [NEW] Option to hide trigger completely (for context menus)
}

export function NewEvaluationDialog({ patientId, patientName, open: controlledOpen, onOpenChange: setControlledOpen, children, noTrigger }: NewEvaluationDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)

    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = isControlled ? setControlledOpen! : setInternalOpen
    const [templates, setTemplates] = useState<any[]>([])
    const [selectedTemplate, setSelectedTemplate] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        if (open) {
            fetchTemplates()
        }
    }, [open])

    const fetchTemplates = async () => {
        const { data, error } = await supabase
            .from('form_templates')
            .select('id, title')
            .eq('is_active', true)
            .order('title')

        if (error) {
            toast.error('Erro ao carregar modelos')
            console.error(error)
        } else {
            setTemplates(data || [])
        }
    }

    const handleStart = async () => {
        if (!selectedTemplate) return

        setLoading(true)
        // Redirect to a new "fill form" page. 
        // We will pass patientId and templateId via URL or create a draft record first.
        // Let's create a draft record first to ensure ID existence for auto-save.

        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            toast.error('Usuário não autenticado')
            setLoading(false)
            return
        }

        // 1. Fetch Template Fields for Snapshot (Versioning Strategy)
        const { data: templateData, error: templateFetchError } = await supabase
            .from('form_templates')
            .select('fields')
            .eq('id', selectedTemplate)
            .single()

        if (templateFetchError || !templateData) {
            console.error(templateFetchError)
            toast.error('Erro ao processar versão do modelo.')
            setLoading(false)
            return
        }

        const { data, error } = await supabase
            .from('patient_records')
            .insert({
                patient_id: patientId,
                template_id: selectedTemplate,
                professional_id: user.id,
                status: 'draft',
                content: {},
                template_snapshot: templateData.fields // Save the exact version of the form
            })
            .select()
            .single()

        if (error) {
            console.error(error)
            toast.error('Erro ao iniciar avaliação')
            setLoading(false)
            return
        }

        toast.success('Avaliação iniciada!')

        // Log Audit Access
        await logAction("CREATE_RECORD", { template_id: selectedTemplate }, 'patient_record', data.id)

        setOpen(false)
        router.push(`/dashboard/patients/${patientId}/records/${data.id}`)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!noTrigger && (
                <DialogTrigger asChild>
                    {children ? children : (
                        <Button size="sm" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Nova Evolução
                        </Button>
                    )}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nova Evolução</DialogTitle>
                    <DialogDescription>
                        Iniciando avaliação para {patientName}. Selecione o modelo.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="template">Modelo de Formulário</Label>
                        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                            <SelectTrigger id="template">
                                <SelectValue placeholder="Selecione um modelo..." />
                            </SelectTrigger>
                            <SelectContent>
                                {templates.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleStart} disabled={!selectedTemplate || loading}>
                        {loading ? 'Criando...' : 'Iniciar Avaliação'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
