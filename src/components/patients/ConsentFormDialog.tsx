"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { logAction } from "@/lib/logger"
import { Loader2 } from "lucide-react"

interface ConsentFormDialogProps {
    patientId: string
    patientName: string
    open?: boolean
    onOpenChange?: (open: boolean) => void
    children?: React.ReactNode
}

export function ConsentFormDialog({ patientId, patientName, children }: ConsentFormDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isSigned, setIsSigned] = useState(false)

    // Canvas Logic
    useEffect(() => {
        if (!open) return

        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Set dimensions (responsive?)
        // canvas.width = canvas.parentElement?.clientWidth || 400
        canvas.width = 500
        canvas.height = 200

        ctx.lineWidth = 2
        ctx.lineCap = "round"
        ctx.strokeStyle = "black"

        let painting = false

        const startPosition = (e: MouseEvent | TouchEvent) => {
            painting = true
            draw(e)
        }

        const endPosition = () => {
            painting = false
            ctx.beginPath()
            // Check if signed (simple check: valid data?)
            // We can assume if endPosition is called, user touched it.
            setIsSigned(true)
        }

        const draw = (e: MouseEvent | TouchEvent) => {
            if (!painting) return

            const rect = canvas.getBoundingClientRect()
            let clientX, clientY

            if (e instanceof MouseEvent) {
                clientX = e.clientX
                clientY = e.clientY
            } else {
                clientX = e.touches[0].clientX
                clientY = e.touches[0].clientY
            }

            ctx.lineTo(clientX - rect.left, clientY - rect.top)
            ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(clientX - rect.left, clientY - rect.top)
        }

        canvas.addEventListener("mousedown", startPosition)
        canvas.addEventListener("touchstart", startPosition)
        canvas.addEventListener("mouseup", endPosition)
        canvas.addEventListener("touchend", endPosition)
        canvas.addEventListener("mousemove", draw)
        canvas.addEventListener("touchmove", draw)

        return () => {
            canvas.removeEventListener("mousedown", startPosition)
            canvas.removeEventListener("touchstart", startPosition)
            canvas.removeEventListener("mouseup", endPosition)
            canvas.removeEventListener("touchend", endPosition)
            canvas.removeEventListener("mousemove", draw)
            canvas.removeEventListener("touchmove", draw)
        }
    }, [open])

    const handleClear = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        setIsSigned(false)
    }

    const handleSave = async () => {
        if (!isSigned) {
            toast.error("Por favor, assine o termo.")
            return
        }
        setLoading(true)

        try {
            const canvas = canvasRef.current
            const signatureDataUrl = canvas?.toDataURL("image/png")
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            // Save to DB
            const { error } = await supabase
                .from('patient_records')
                .insert({
                    patient_id: patientId,
                    professional_id: user?.id,
                    record_type: 'consent', // Special type
                    status: 'finalized', // TCLE is always final
                    content: {
                        type: 'TCLE',
                        version: '1.0',
                        signature: signatureDataUrl, // Storing Base64 for simplicity now, ideally Storage Bucket
                        signed_at: new Date().toISOString()
                    }
                })

            if (error) throw error

            await logAction("SIGN_CONSENT", { patient_id: patientId, type: 'TCLE' }, 'consent', patientId)

            toast.success("Termo assinado com sucesso!")
            setOpen(false)

        } catch (error) {
            console.error(error)
            toast.error("Erro ao salvar consentimento.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || <Button variant="outline">Termo de Consentimento</Button>}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Termo de Consentimento Livre e Esclarecido</DialogTitle>
                    <DialogDescription>
                        Por favor, leia atentamente e assine abaixo.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[200px] border p-4 rounded-md text-sm text-justify">
                    <p className="mb-4">
                        Eu, devidamente identificado neste cadastro, autorizo a realização de consultas, exames e procedimentos fisioterapêuticos necessários ao meu tratamento.
                    </p>
                    <p className="mb-4">
                        Fui esclarecido(a) sobre os objetivos, benefícios e eventuais riscos dos procedimentos. Tive a oportunidade de fazer perguntas e todas foram respondidas satisfatoriamente.
                    </p>
                    <p className="mb-4">
                        Estou ciente de que posso revogar este consentimento a qualquer momento, sem prejuízo ao meu atendimento, exceto para procedimentos já realizados.
                    </p>
                    <p>
                        Autorizo também o uso de dados anônimos para fins estatísticos e de melhoria dos serviços, conforme a Lei Geral de Proteção de Dados (LGPD).
                    </p>
                </ScrollArea>

                <div className="space-y-2">
                    <div className="text-sm font-medium">Assinatura Digital</div>
                    <div className="border border-dashed border-gray-400 rounded-md bg-white flex justify-center touch-none">
                        <canvas
                            ref={canvasRef}
                            className="cursor-crosshair bg-white w-full max-w-[500px]"
                            style={{ touchAction: 'none' }}
                        />
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleClear} className="text-xs text-muted-foreground">
                        Limpar Assinatura
                    </Button>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={loading || !isSigned}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar Assinatura
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
