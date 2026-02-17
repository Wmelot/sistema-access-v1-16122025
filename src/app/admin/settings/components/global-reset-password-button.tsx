'use client'

import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"

const MySwal = withReactContent(Swal)

export function GlobalResetPasswordButton() {
    const handleReset = async () => {
        const result = await MySwal.fire({
            title: 'Forçar Reset Global?',
            text: "Todos os usuários serão deslogados e obrigados a trocar a senha no próximo acesso. Esta ação é irreversível.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Sim, resetar tudo!',
            cancelButtonText: 'Cancelar'
        })

        if (result.isConfirmed) {
            toast.info("Funcionalidade em desenvolvimento. (Proteção de segurança ativa)")
        }
    }

    return (
        <Button
            variant="outline"
            onClick={handleReset}
            className="text-red-600 border-red-200 bg-red-50 hover:bg-red-100 w-full sm:w-auto font-bold"
        >
            Forçar Reset de Senha (Global)
        </Button>
    )
}
