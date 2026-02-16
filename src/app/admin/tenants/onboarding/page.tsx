import { ShieldCheck, PlusCircle } from 'lucide-react'
import { OnboardingForm } from './onboarding-form'

export default function OnboardingPage() {
    return (
        <div className="container mx-auto py-10 max-w-5xl space-y-8">
            <div className="flex items-center justify-between border-b pb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-zinc-900 text-[10px] font-black text-white px-2 py-0.5 rounded uppercase tracking-widest">Master</span>
                        <h1 className="text-3xl font-black tracking-tight text-zinc-900">Módulo de Ativação</h1>
                    </div>
                    <p className="text-sm text-zinc-500 font-medium">Cadastre e configure novas organizações no ecossistema Axiom Clinic.</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400">
                    <PlusCircle className="w-6 h-6" />
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-amber-900">Segurança Master</h3>
                    <p className="text-xs text-amber-800/80 leading-relaxed">
                        Esta operação cria registros estruturais no banco de dados. Certifique-se de que o e-mail do proprietário está correto
                        e que o mesmo já realizou o primeiro acesso ao sistema através do convite ou login Google.
                    </p>
                </div>
            </div>

            <OnboardingForm />
        </div>
    )
}
