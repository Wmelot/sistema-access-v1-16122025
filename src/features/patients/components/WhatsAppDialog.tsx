'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { MessageCircle, Send, Loader2 } from 'lucide-react'
import { sendMessage } from '@/app/dashboard/[slug]/settings/communication/actions'
import { toast } from 'sonner'

interface WhatsAppDialogProps {
    patientId: string
    patientName: string
    phone: string
}

export function WhatsAppDialog({ patientId, patientName, phone }: WhatsAppDialogProps) {
    const [open, setOpen] = useState(false)
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSend = async () => {
        if (!message.trim()) {
            toast.error("Digite uma mensagem.")
            return
        }

        setLoading(true)
        try {
            const res = await sendMessage(phone, message, undefined, {
                patientId,
                type: 'direct'
            })

            if (res.success) {
                toast.success("Mensagem enviada com sucesso!")
                setMessage('')
                setOpen(false)
            } else {
                toast.error(res.error || "Erro ao enviar mensagem.")
            }
        } catch (error) {
            toast.error("Erro inesperado ao enviar.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50">
                    <MessageCircle className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Enviar WhatsApp</DialogTitle>
                    <DialogDescription>
                        Envie uma mensagem direta para <strong>{patientName}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Textarea
                        placeholder="Digite sua mensagem aqui..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="min-h-[120px]"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSend} disabled={loading || !message.trim()}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Enviar Mensagem
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
