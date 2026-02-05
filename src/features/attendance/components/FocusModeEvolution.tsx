import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    ArrowLeft,
    Save,
    Mic,
    X,
    Type,
    Check,
    Undo,
    Eraser,
    MoveHorizontal,
    History,
    Sparkles,
    MessageSquare,
    ClipboardCheck,
    Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { VoiceRecorder } from "@/components/ui/voice-recorder"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface FocusModeEvolutionProps {
    isOpen: boolean
    onClose: () => void
    data: any
    onUpdate: (path: string, value: any) => void
    onSave: (path: string, value: any, label: string) => Promise<boolean>
    templateType?: string
}

const FIELD_CONFIGS: Record<string, Array<{ label: string, path: string, icon: any, placeholder: string }>> = {
    'smart': [
        { label: "Queixa Principal (QP)", path: "qp", icon: MessageSquare, placeholder: "Como o paciente descreve a dor?" },
        { label: "Histórico (HMA)", path: "hma", icon: History, placeholder: "Início dos sintomas, evolução..." },
        { label: "História Pregressa", path: "history.hp", icon: ClipboardCheck, placeholder: "Cirurgias, patologias, etc." },
        { label: "Observações Físicas", path: "physicalExam.observation", icon: Sparkles, placeholder: "O que você observou no exame?" },
        { label: "Medicações", path: "history.medication", icon: Type, placeholder: "Medicamentos em uso..." },
    ],
    'default': [
        { label: "Evolução do Dia", path: "evolution_text", icon: MessageSquare, placeholder: "Descreva a evolução técnica da sessão de hoje..." },
        { label: "Observações", path: "observations", icon: Sparkles, placeholder: "Observações clínicas relevantes..." },
        { label: "Conduta", path: "plan", icon: ClipboardCheck, placeholder: "O que foi feito e orientações passadas..." },
    ]
}

export function FocusModeEvolution({ isOpen, onClose, data, onUpdate, onSave, templateType = 'default' }: FocusModeEvolutionProps) {
    const fields = FIELD_CONFIGS[templateType === 'smart' || templateType === 'assessment' ? 'smart' : 'default'] || FIELD_CONFIGS.default

    const [activeFieldIndex, setActiveFieldIndex] = useState(0)
    const activeField = fields[activeFieldIndex]
    const [localValue, setLocalValue] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [lastSavedValues, setLastSavedValues] = useState<Record<string, string>>({})

    const getValue = (path: string) => {
        if (!data) return ''
        const keys = path.split('.')
        let current = data
        for (const k of keys) {
            if (current === undefined || current === null) return ''
            current = current[k]
        }
        return current || ''
    }

    useEffect(() => {
        const val = getValue(activeField.path)
        setLocalValue(val)
    }, [activeFieldIndex, data])

    const handleChange = (val: string) => {
        setLocalValue(val)
        onUpdate(activeField.path, val)
    }

    const appendText = (text: string) => {
        const newVal = localValue ? localValue.trim() + "\n" + text : text
        handleChange(newVal)
    }

    const handleInternalSave = async () => {
        if (!localValue.trim()) {
            toast.error("Campo vazio!")
            return
        }

        setIsSaving(true)
        try {
            const success = await onSave(activeField.path, localValue, activeField.label)
            if (success) {
                setLastSavedValues(prev => ({ ...prev, [activeField.path]: localValue }))
            }
        } finally {
            setIsSaving(false)
        }
    }

    if (!isOpen) return null

    const hasChanges = localValue !== (lastSavedValues[activeField.path] || getValue(activeField.path))

    return (
        <div className="fixed inset-0 z-[100] bg-[#0f172a] flex flex-col animate-in fade-in zoom-in-95 duration-300">
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />

            {/* Header */}
            <header className="h-20 border-b border-white/10 flex items-center justify-between px-6 backdrop-blur-md bg-black/20 z-10">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="text-white/60 hover:text-white hover:bg-white/10 gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Pausar Foco
                    </Button>
                    <div className="h-4 w-[1px] bg-white/10 hidden md:block" />
                    <div className="hidden md:flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="text-white/40 text-xs font-medium uppercase tracking-widest">Sessão em Foco</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleInternalSave}
                        disabled={isSaving || !hasChanges}
                        className={cn(
                            "h-10 px-6 font-bold transition-all duration-300",
                            hasChanges
                                ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                                : "bg-white/5 text-white/40 border border-white/10"
                        )}
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Salvar {activeField.label.split(' ')[0]}
                    </Button>

                    <Button
                        onClick={onClose}
                        variant="default"
                        className="h-10 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] gap-2 group"
                    >
                        <Check className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        Concluir
                    </Button>
                </div>
            </header>

            {/* Field Tabs - Floating pill design */}
            <div className="relative py-6 flex justify-center z-10">
                <div className="bg-white/5 p-1 rounded-2xl border border-white/10 flex items-center gap-1 backdrop-blur-xl">
                    {fields.map((f, idx) => (
                        <button
                            key={f.path}
                            onClick={() => setActiveFieldIndex(idx)}
                            className={cn(
                                "px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 whitespace-nowrap",
                                idx === activeFieldIndex
                                    ? "bg-white text-slate-950 shadow-xl scale-105"
                                    : "text-white/60 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <f.icon className={cn("w-4 h-4", idx === activeFieldIndex ? "text-indigo-600" : "text-white/40")} />
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center px-4 md:px-8 pb-32 overflow-hidden relative">
                <div className="w-full max-w-5xl h-full flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500">

                    {/* Active Field Title & Hint */}
                    <div className="flex flex-col items-center text-center gap-2">
                        <Badge variant="outline" className="text-indigo-400 border-indigo-400/30 bg-indigo-400/5 px-3 py-1 uppercase tracking-[0.2em] text-[10px] font-black">
                            {activeField.label}
                        </Badge>
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                            Descreva os detalhes.
                        </h1>
                    </div>

                    {/* Text Area Container */}
                    <div className="flex-1 min-h-[300px] relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur opacity-20 group-focus-within:opacity-40 transition-opacity duration-500" />

                        <div className="relative h-full bg-slate-900/80 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm flex flex-col shadow-2xl">
                            <Textarea
                                value={localValue}
                                onChange={(e) => handleChange(e.target.value)}
                                className="flex-1 w-full p-8 md:p-12 text-2xl md:text-3xl leading-relaxed text-slate-100 placeholder:text-white/10 bg-transparent border-none focus-visible:ring-0 resize-none font-medium selection:bg-indigo-500/30"
                                placeholder={activeField.placeholder}
                            />

                            {/* Toolbar */}
                            <div className="h-16 border-t border-white/5 bg-black/20 flex items-center justify-between px-6">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => handleChange('')}
                                        className="text-white/20 hover:text-red-400 transition-colors flex items-center gap-2 text-sm font-bold"
                                    >
                                        <Eraser className="w-4 h-4" />
                                        Limpar
                                    </button>
                                </div>

                                <div className="text-white/20 text-xs font-mono">
                                    {localValue.length} caracteres
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Fixed Bottom Mic Section - Centralized and Floating */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-50">
                <div className="relative flex items-center justify-center">
                    {/* Recording Ripple Effect */}
                    <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20 group-data-[recording=true]:block hidden" />

                    <div className="bg-slate-900/90 p-3 rounded-full border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl flex items-center gap-4 group">
                        <div className="pl-4 pr-2 hidden md:block border-r border-white/10">
                            <div className="text-white/80 font-bold text-sm">Ditar Conteúdo</div>
                            <div className="text-white/40 text-[10px] uppercase tracking-tighter">Powered by Whisper AI</div>
                        </div>

                        <VoiceRecorder
                            onTranscriptionComplete={appendText}
                            className="focus:ring-0"
                        />
                    </div>
                </div>

                <p className="text-white/30 text-xs font-medium animate-pulse">
                    Toque no microfone para transformar voz em texto clínico
                </p>
            </div>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    )
}
