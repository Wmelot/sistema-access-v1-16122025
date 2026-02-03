"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Link2, Check, Loader2, Activity, Send, Copy, MoreHorizontal } from "lucide-react"
import { toast } from "sonner"
import { generateConsentToken } from "@/actions/patients"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface GenerateConsentButtonProps {
    patientId: string
    hasConsented: boolean
}

export function GenerateConsentButton({ patientId, hasConsented }: GenerateConsentButtonProps) {
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    const handleAction = async (sendWhatsApp: boolean) => {
        setLoading(true)
        try {
            const res = await generateConsentToken(patientId, sendWhatsApp)

            if (res?.error) {
                toast.error(res.error)
            } else if (res?.url) {
                if (sendWhatsApp) {
                    if (res.warning) toast.warning(res.warning)
                    else toast.success("Link enviado via WhatsApp com sucesso!")
                } else {
                    await navigator.clipboard.writeText(res.url)
                    setCopied(true)
                    toast.success("Link copiado!")
                    setTimeout(() => setCopied(false), 2000)
                }
            }
        } catch (e) {
            toast.error("Erro ao processar")
        } finally {
            setLoading(false)
        }
    }

    if (hasConsented) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700 bg-green-50">
                            <Activity className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Consentimento LGPD Ativo</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> :
                        copied ? <Check className="h-4 w-4" /> :
                            <Link2 className="h-4 w-4" />}
                    {copied ? "Copiado!" : <span className="hidden md:inline">Link LGPD</span>}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleAction(false)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction(true)}>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar WhatsApp
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
