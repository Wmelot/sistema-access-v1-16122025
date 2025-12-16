"use client"

import { useState, useEffect, useRef } from "react"
import { useDebounce } from "use-debounce"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Save, CheckCircle, Clock } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

import { saveAttendanceRecord, finishAttendance } from "./actions"

interface AttendanceClientProps {
    appointment: any
    patient: any
    templates: any[]
    preferences: any[]
    existingRecord: any
    history: any[]
}

export function AttendanceClient({
    appointment,
    patient,
    templates,
    preferences,
    existingRecord,
    history
}: AttendanceClientProps) {
    const router = useRouter()

    // Determine default template
    // Priority: Existing Record > User Preference (Favorite) > First Active > None
    const getInitialTemplateId = () => {
        if (existingRecord?.template_id) return existingRecord.template_id
        const fav = preferences.find(p => p.is_favorite)
        if (fav) return fav.template_id
        if (templates.length > 0) return templates[0].id
        return ""
    }

    const [selectedTemplateId, setSelectedTemplateId] = useState<string>(getInitialTemplateId())
    const [formContent, setFormContent] = useState<any>(existingRecord?.content || {})
    const [lastSaved, setLastSaved] = useState<Date | null>(existingRecord ? new Date(existingRecord.updated_at) : null)
    const [isSaving, setIsSaving] = useState(false)

    // Autosave Debounce
    const [debouncedContent] = useDebounce(formContent, 2000)

    useEffect(() => {
        if (debouncedContent && Object.keys(debouncedContent).length > 0) {
            handleSave()
        }
    }, [debouncedContent])

    const handleSave = async (manual = false) => {
        setIsSaving(true)
        const res = await saveAttendanceRecord({
            appointment_id: appointment.id,
            patient_id: patient.id,
            template_id: selectedTemplateId,
            content: formContent,
            record_id: existingRecord?.id // In a real app, we need to update this ID after first save if it was null
        })

        setIsSaving(false)
        if (res.success) {
            setLastSaved(new Date())
            if (manual) toast.success("Salvo com sucesso!")
        } else {
            if (manual) toast.error("Erro ao salvar")
        }
    }

    const handleFinish = async () => {
        await handleSave(false) // Force save one last time
        toast.promise(finishAttendance(appointment.id, {
            appointment_id: appointment.id,
            patient_id: patient.id,
            template_id: selectedTemplateId,
            content: formContent,
            record_id: existingRecord?.id
        }), {
            loading: 'Finalizando...',
            success: 'Atendimento finalizado!',
            error: 'Erro ao finalizar'
        })
    }

    const selectedTemplate = templates.find(t => t.id === selectedTemplateId)

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4 mb-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border">
                            <AvatarImage src={patient.image_url} />
                            <AvatarFallback>{patient.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-lg font-bold leading-none">{patient.name}</h1>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <span>{patient.birth_date ? '?? anos' : 'Cadastro incompleto'}</span>
                                <Separator orientation="vertical" className="h-3" />
                                <span className="uppercase text-xs">{appointment.services?.name || "Consulta"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {lastSaved && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            Salvo às {format(lastSaved, "HH:mm:ss")}
                        </div>
                    )}
                    <Button variant="outline" onClick={() => handleSave(true)} disabled={isSaving}>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar
                    </Button>
                    <Button onClick={handleFinish} className="bg-green-600 hover:bg-green-700 text-white">
                        Finalizar Atendimento
                    </Button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 overflow-hidden">
                {/* Main Content: Form */}
                <Card className="flex flex-col h-full border-0 shadow-none bg-slate-50/50">
                    <CardHeader className="pb-2 px-0">
                        <div className="flex items-center gap-4">
                            <Label className="whitespace-nowrap">Modelo de Prontuário:</Label>
                            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                                <SelectTrigger className="w-[300px] bg-white">
                                    <SelectValue placeholder="Selecione um modelo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <Separator />
                    <ScrollArea className="flex-1 pr-4 -mr-4">
                        <CardContent className="pt-6 px-1">
                            {selectedTemplate ? (
                                <div className="space-y-6 max-w-3xl mx-auto">
                                    {/* Dynamic Form Rendering */}
                                    {/* Assuming template.fields is an array of field defs */}
                                    {(selectedTemplate.fields as any[])?.map((field: any, idx: number) => (
                                        <div key={idx} className="space-y-2 bg-white p-4 rounded-lg border shadow-sm">
                                            <Label className="text-base font-semibold text-slate-700">{field.label}</Label>

                                            {field.type === 'text' && (
                                                <Input
                                                    value={formContent[field.id] || ''}
                                                    onChange={e => setFormContent({ ...formContent, [field.id]: e.target.value })}
                                                    placeholder={field.placeholder}
                                                />
                                            )}

                                            {field.type === 'textarea' && (
                                                <Textarea
                                                    value={formContent[field.id] || ''}
                                                    onChange={e => setFormContent({ ...formContent, [field.id]: e.target.value })}
                                                    placeholder={field.placeholder}
                                                    className="min-h-[100px]"
                                                />
                                            )}

                                            {field.type === 'select' && (
                                                <Select
                                                    value={formContent[field.id]}
                                                    onValueChange={val => setFormContent({ ...formContent, [field.id]: val })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {field.options?.map((opt: string) => (
                                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}

                                            {/* Fallback for simple note if no complex fields */}
                                        </div>
                                    ))}

                                    {(!selectedTemplate.fields || selectedTemplate.fields.length === 0) && (
                                        <div className="bg-white p-4 rounded-lg border shadow-sm space-y-2">
                                            <Label className="text-base font-semibold">Evolução / Anotações</Label>
                                            <Textarea
                                                value={formContent['notes'] || ''}
                                                onChange={e => setFormContent({ ...formContent, ['notes']: e.target.value })}
                                                placeholder="Descreva o atendimento..."
                                                className="min-h-[300px]"
                                            />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-muted-foreground">
                                    Selecione um modelo para começar.
                                </div>
                            )}
                        </CardContent>
                    </ScrollArea>
                </Card>

                {/* Sidebar: History */}
                <div className="border-l pl-6 h-full flex flex-col overflow-hidden hidden lg:flex">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Histórico Recente
                    </h3>
                    <ScrollArea className="flex-1 pr-4">
                        <div className="space-y-4">
                            {history.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-8">Nenhum histórico disponível.</p>
                            )}
                            {history.map(rec => (
                                <Card key={rec.id} className="bg-slate-50">
                                    <CardHeader className="p-3 pb-1">
                                        <CardTitle className="text-sm">{format(new Date(rec.created_at), "dd/MM/yyyy HH:mm")}</CardTitle>
                                        <CardDescription className="text-xs">{rec.form_templates?.title || 'Sem modelo'}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-3 pt-2 text-xs text-muted-foreground line-clamp-4">
                                        {/* Simple visualization of content */}
                                        {Object.values(rec.content).join(', ')}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    )
}
