import { isMasterSupportMode } from "@/lib/auth/support-mode"
import { ShieldAlert } from "lucide-react"

export async function SupportModeBar() {
    const isSupport = await isMasterSupportMode()

    if (!isSupport) return null

    return (
        <div className="w-full bg-amber-100 border-b border-amber-200 py-1 px-4 flex items-center justify-center gap-2 text-xs font-medium text-amber-900 z-50 animate-in slide-in-from-top">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
            <span>
                MODO SUPORTE MASTER: Dados sensíveis (CPF, Telefone, Prontuários) estão mascarados por ética e LGPD.
            </span>
        </div>
    )
}
