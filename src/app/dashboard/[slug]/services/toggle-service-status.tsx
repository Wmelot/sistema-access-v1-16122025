"use client"

import { Button } from "@/components/ui/button"
import { Power, PowerOff } from "lucide-react"
import { toggleServiceStatus } from "./actions"
import { useState } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ToggleServiceStatusProps {
    serviceId: string
    isActive: boolean
}

export function ToggleServiceStatus({ serviceId, isActive }: ToggleServiceStatusProps) {
    const [loading, setLoading] = useState(false)

    async function handleToggle() {
        if (loading) return
        setLoading(true)
        try {
            const result = await toggleServiceStatus(serviceId, isActive)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(isActive ? "Serviço desativado!" : "Serviço ativado!")
            }
        } catch (error) {
            toast.error("Erro ao alterar status")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            disabled={loading}
            className={cn(
                "h-8 w-8",
                isActive ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-slate-400 hover:text-slate-500 hover:bg-slate-50"
            )}
            title={isActive ? "Desativar Serviço" : "Ativar Serviço"}
        >
            {isActive ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
        </Button>
    )
}
