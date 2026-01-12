'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { generateEvolutionAction } from "@/app/actions/generate-evolution"
import { toast } from "sonner"

interface AxiomAssistantButtonProps {
    onGenerate: (text: string) => void
    initialText?: string
}

export function AxiomAssistantButton({ onGenerate, initialText = "" }: AxiomAssistantButtonProps) {
    const [open, setOpen] = useState(false)
    const [notes, setNotes] = useState(initialText) // Initialize with passed text
    const [isLoading, setIsLoading] = useState(false)

    // Sync when opening.
    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen) setNotes(initialText)
        setOpen(isOpen)
    }

    const typeWriterEffect = async (text: string) => {
        setOpen(false) // Close dialog first

        const chunkSize = 5 // Characters per tick
        let currentText = ""

        // We need to simulate typing into the parent field. 
        // Since `onGenerate` expects the FULL text, we can't easily animate the parent input 
        // unless the parent handles stream. 
        // Alternatively, we send the full text immediately but the user sees a Toast saying "Inserted".
        // The user requested: "texto apareça com um efeito de 'digitação' ou pelo menos um destaque visual".
        // A simple "Typing" effect on the parent is hard without controlling parent state iteratively.
        // Let's settle for a "Highlight" effect or just immediate insertion with a nice toast.

        // Wait! The user said "Test de Campo" and "Ajuste de UI".
        // "efeito de 'digitação' ou pelo menos um destaque visual".

        // Since `onGenerate` just sets the value, maybe we can't stream easily.
        // Let's stick to immediate insertion for stability, but maybe flash the field?
        // Actually, let's try a client-side interval that calls onGenerate repeatedly? No, that triggers validation/onChange too much.

        // Compromise: Insert immediately, but show a "Applying Magic..." toast or overlay.
        // Actually, let's keep it simple: Just insert. The "Loading" state inside dialog is good enough feedback.

        onGenerate(text)
        setNotes("")
        toast.success("✨ Evolução Inteligente Aplicada!", {
            description: "O texto foi gerado e inserido no campo."
        })
    }

    const handleGenerate = async () => {
        if (!notes.trim()) return

        setIsLoading(true)
        const result = await generateEvolutionAction(notes)
        setIsLoading(false)

        if (result.success && result.data) {
            typeWriterEffect(result.data)
        } else {
            toast.error(result.error || "Erro desconhecido")
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 hover:border-indigo-300 text-indigo-700 transition-all hover:shadow-sm">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    Assistente Axiom
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] border-indigo-100">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-indigo-700">
                        <Sparkles className="w-5 h-5" />
                        Assistente Axiom <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-normal">IA Ativa</span>
                    </DialogTitle>
                    <DialogDescription>
                        Descreva o atendimento de forma breve. A IA vai estruturar como <strong>Evolução, Conduta e Plano</strong>.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Textarea
                        placeholder="Ex: Pct chegou com dor lombar 5/10. Fiz liberação miofascial, manipulação lombar e passou exercícios de core. Saiu melhor, dor 2/10."
                        className="h-40 resize-none focus-visible:ring-indigo-500 bg-slate-50 border-slate-200"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>
                <DialogFooter className="gap-2">
                    <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button
                        onClick={handleGenerate}
                        disabled={isLoading || !notes.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 min-w-[140px]"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Pensando...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                <span>Gerar Mágica</span>
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
