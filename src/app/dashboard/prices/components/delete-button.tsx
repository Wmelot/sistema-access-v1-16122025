"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deletePriceTable } from "../actions"
import { toast } from "sonner"
import { useTransition } from "react"

export function DeleteTableButton({ id }: { id: string }) {
    const [isPending, startTransition] = useTransition()

    function handleDelete() {
        if (!confirm("Tem certeza? Isso pode afetar pacientes vinculados.")) return

        startTransition(async () => {
            const result = await deletePriceTable(id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Tabela removida.")
            }
        })
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-red-500"
            onClick={handleDelete}
            disabled={isPending}
            title="Excluir tabela"
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    )
}
