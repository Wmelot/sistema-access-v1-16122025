import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, Save, Mic, X, Type, Check, Undo, Eraser, MoveHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { VoiceRecorder } from "@/components/ui/voice-recorder"
import { Badge } from "@/components/ui/badge"

interface FocusModeEvolutionProps {
    isOpen: boolean
    onClose: () => void
    data: any
    onUpdate: (path: string, value: any) => void
    templateType?: string
}

// Configuration for fields based on template type
// We map a "Friendly Label" to a "Object Path"
const FIELD_CONFIGS: Record<string, Array<{ label: string, path: string, icon?: any }>> = {
    'smart': [
        { label: "Queixa Principal (QP)", path: "qp" },
        { label: "Histórico (HMA)", path: "hma" },
        { label: "História Pregressa", path: "history.hp" },
        { label: "Observações Físicas", path: "physicalExam.observation" },
        { label: "Medicações", path: "history.medication" },
        { label: "Qualidade Movimento", path: "physicalExam.movementQuality.other" },
    ],
    'default': [
        { label: "Evolução do Dia", path: "evolution_text" },
        { label: "Observações", path: "observations" },
        { label: "Conduta", path: "plan" },
    ]
}

export function FocusModeEvolution({ isOpen, onClose, data, onUpdate, templateType = 'default' }: FocusModeEvolutionProps) {
    // Determine effective fields
    // If templateType is known smart/physical, use that. Else default.
    // We can also try to infer.
    const fields = FIELD_CONFIGS[templateType === 'smart' || templateType === 'assessment' ? 'smart' : 'default']

    const [activeFieldIndex, setActiveFieldIndex] = useState(0)
    const activeField = fields[activeFieldIndex]

    // Local state for the text being edited to avoid lag on giant font rendering?
    // Or direct bind. Let's try direct bind first, but safe access.

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

    const [localValue, setLocalValue] = useState("")

    // Sync local value when active field changes
    useEffect(() => {
        setLocalValue(getValue(activeField.path))
    }, [activeField, data]) // Update if data changes externally too

    // Debounced update to parent? Or on blur/change? 
    // To ensure "Save" works, we should update parent on change.
    const handleChange = (val: string) => {
        setLocalValue(val)
        onUpdate(activeField.path, val)
    }

    const appendText = (text: string) => {
        const newVal = localValue ? localValue + " " + text : text
        handleChange(newVal)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in fade-in duration-200">
            {/* Header */}
            <header className="h-16 border-b flex items-center justify-between px-4 bg-muted/20 shrink-0">
                <Button variant="ghost" size="lg" onClick={onClose} className="gap-2">
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-semibold text-lg">Sair do Foco</span>
                </Button>

                <div className="flex items-center gap-2">
                    <Button onClick={onClose} variant="default" size="lg" className="bg-green-600 hover:bg-green-700 text-white gap-2 px-6">
                        <Check className="w-5 h-5" />
                        Concluir
                    </Button>
                </div>
            </header>

            {/* Field Selector (Tabs) */}
            <div className="h-16 border-b bg-white flex items-center px-4 gap-2 overflow-x-auto no-scrollbar shrink-0">
                {fields.map((f, idx) => (
                    <button
                        key={f.path}
                        onClick={() => setActiveFieldIndex(idx)}
                        className={cn(
                            "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border-2",
                            idx === activeFieldIndex
                                ? "bg-primary text-primary-foreground border-primary shadow-md transform scale-105"
                                : "bg-transparent text-muted-foreground border-transparent hover:bg-muted"
                        )}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col p-2 md:p-8 max-w-4xl mx-auto w-full gap-2 md:gap-4 overflow-hidden bg-background">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-lg md:text-2xl font-bold text-primary truncate">{activeField.label}</h2>
                    <Badge variant="outline" className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest shrink-0">
                        Editando
                    </Badge>
                </div>

                <div className="flex-1 relative rounded-xl border-2 border-primary/20 bg-muted/10 overflow-hidden focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5 transition-all w-full flex flex-col">
                    <Textarea
                        value={localValue}
                        onChange={(e) => handleChange(e.target.value)}
                        className="w-full h-full resize-none border-none p-4 md:p-6 text-lg md:text-2xl leading-relaxed bg-transparent focus-visible:ring-0 text-foreground"
                        placeholder={`Digite ou dite sobre: ${activeField.label}...`}
                    />

                    {/* Floating Action Bar inside Text Area */}
                    <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 flex items-center gap-2 md:gap-3 z-30 pointer-events-none">
                        <div className="pointer-events-auto flex items-center gap-2 md:gap-3">
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-10 w-10 md:h-12 md:w-12 rounded-full shadow-lg opacity-80 hover:opacity-100 bg-background/80 backdrop-blur-sm border"
                                onClick={() => handleChange('')}
                                title="Limpar campo"
                            >
                                <Eraser className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                            </Button>

                            <div className="scale-100 md:scale-125 origin-right relative z-40 bg-background rounded-full shadow-sm">
                                <VoiceRecorder
                                    onTranscriptionComplete={appendText}
                                    className=""
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-center text-xs md:text-sm text-muted-foreground px-4">
                    Dica: Use o microfone para ditar. O texto será adicionado ao final.
                </p>
            </div>
        </div>
    )
}
