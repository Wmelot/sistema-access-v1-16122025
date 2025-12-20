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
    noTrigger?: boolean // [NEW] Option to hide trigger completely
    type?: 'assessment' | 'evolution' // [NEW] Distinguish types
}

export function NewEvaluationDialog({ patientId, patientName, open: controlledOpen, onOpenChange: setControlledOpen, children, noTrigger, type = 'assessment' }: NewEvaluationDialogProps) {
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
        let query = supabase
            .from('form_templates')
            .select('id, title, type')
            .eq('is_active', true)
            .order('title')

        // Filter by type if column exists (it should after migration)
        // We can optimistically try to filter, or fetch all and filter client side if migration isn't guaranteed?
        // Let's assume migration. But to be safe against errors if migration NOT run yet, we might want to catch error?
        // Supabase ignore extra filters usually? No, it errors.
        // Let's rely on migration being run. 
        if (type) {
            query = query.eq('type', type)
        }

        const { data, error } = await query

        if (error) {
            // Fallback: If column 'type' doesn't exist yet, fetching might fail.
            // Try fetching without filter if error code indicates missing column?
            // "42703" is undefined_column.
            if (error.code === '42703') {
                const { data: fallbackData } = await supabase
                    .from('form_templates')
                    .select('id, title')
                    .eq('is_active', true)
                setTemplates(fallbackData || [])
            } else {
                toast.error('Erro ao carregar modelos')
                console.error(error)
            }
        } else {
            setTemplates(data || [])
        }
    }

    const handleStart = async () => {
        if (!selectedTemplate) return

        setLoading(true)

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
                template_snapshot: templateData.fields,
                record_type: type // [NEW] Save type
            })
            .select()
            .single()

        if (error) {
            console.error(error)
            toast.error('Erro ao iniciar registro')
            setLoading(false)
            return
        }

        toast.success(type === 'evolution' ? 'Evolução iniciada!' : 'Avaliação iniciada!')

        // Log Audit Access
        await logAction("CREATE_RECORD", { template_id: selectedTemplate, type }, 'patient_record', data.id)

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
                            {type === 'evolution' ? 'Nova Evolução' : 'Nova Avaliação'}
                        </Button>
                    )}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{type === 'evolution' ? 'Nova Evolução' : 'Nova Avaliação'}</DialogTitle>
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
