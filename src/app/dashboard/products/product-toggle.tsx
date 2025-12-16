"use client"

import { Switch } from "@/components/ui/switch"
import { toggleProductStatus } from "@/app/dashboard/products/actions"
import { useState } from "react"
import { toast } from "sonner"

export function ProductToggle({ id, isActive, disabled }: { id: string, isActive: boolean, disabled?: boolean }) {
    const [loading, setLoading] = useState(false)

    const handleToggle = async (checked: boolean) => {
        setLoading(true)
        try {
            const result = await toggleProductStatus(id, !checked) // checked is the NEW state, but action asks for CURRENT status to flip it
            // Actually action logic is: update({ active: !currentStatus }).
            // If isActive=true (current), I click, new state is false.
            // Let's just pass the ID and the CURRENT status known to the action, or better yet, pass the DESIRED status.

            // Re-reading action: toggleProductStatus(id, currentStatus) -> sets active: !currentStatus.
            // So if I pass `isActive` (true), it sets to false. Correct.

            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success(checked ? "Produto ativado" : "Produto desativado")
            }
        } catch (error) {
            toast.error("Erro ao atualizar status")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center gap-2" title={isActive ? "Desativar Produto" : "Ativar Produto"}>
            <Switch
                checked={isActive}
                onCheckedChange={handleToggle}
                disabled={disabled || loading}
            />
        </div>
    )
}
