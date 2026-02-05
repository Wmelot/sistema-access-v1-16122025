"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deletePriceTable } from "../actions"
import { toast } from "sonner"
import { useTransition } from "react"
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

export function DeleteTableButton({ id }: { id: string }) {
    const [isPending, startTransition] = useTransition()

    async function handleDelete() {
        const result = await MySwal.fire({
            title: 'Excluir Tabela?',
            text: "Tem certeza? Isso pode afetar pacientes vinculados.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Sim, excluir',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return

        startTransition(async () => {
            const res = await deletePriceTable(id)
            if (res.error) {
                toast.error(res.error)
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
