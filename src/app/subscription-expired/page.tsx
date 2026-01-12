import { Button } from "@/components/ui/button"
import { Lock, CreditCard, ExternalLink } from "lucide-react"
import Link from "next/link"

export default function SubscriptionExpiredPage() {
    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
            <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center border-2 border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                        <Lock className="w-10 h-10 text-indigo-400" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-3xl font-bold tracking-tighter text-white">
                        Seu período de teste acabou
                    </h1>
                    <p className="text-zinc-400 text-lg">
                        Esperamos que você tenha aproveitado o Axiom.
                        Para continuar transformando seus atendimentos, ative sua assinatura.
                    </p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">Plano Basic</span>
                        <span className="text-white font-bold">R$ 97,00/mês</span>
                    </div>
                    <div className="h-px bg-zinc-800" />
                    <ul className="text-left text-sm space-y-2 text-zinc-300">
                        <li className="flex items-center gap-2">✓ Acesso completo ao Prontuário Inteligente</li>
                        <li className="flex items-center gap-2">✓ Inteligência Artificial (Gemini)</li>
                        <li className="flex items-center gap-2">✓ Suporte via WhatsApp</li>
                    </ul>
                </div>

                <div className="space-y-3">
                    <Button asChild className="w-full h-12 text-base bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-900/20">
                        <Link href="https://www.asaas.com/checkout/start/..." target="_blank">
                            <CreditCard className="mr-2 h-5 w-5" />
                            Assinar Agora (Asaas)
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full text-zinc-500 hover:text-zinc-300">
                        <Link href="/">
                            Voltar para Home
                        </Link>
                    </Button>
                </div>

                <p className="text-xs text-zinc-600">
                    Se você já realizou o pagamento, aguarde alguns minutos ou entre em contato com o suporte.
                </p>
            </div>
        </div>
    )
}
