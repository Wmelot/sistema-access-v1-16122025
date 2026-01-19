import { SignupForm } from "./signup-form";
import { Suspense } from 'react';
import Image from 'next/image';
import { Brain } from 'lucide-react';

export default async function SignupPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>
}) {
    const { error } = await searchParams
    return (
        <div className="min-h-screen w-full flex bg-slate-950">

            {/* Left Side - Image (50% width on large screens) */}
            <div className="hidden lg:block relative w-1/2 h-screen bg-slate-900 overflow-hidden">
                <Image
                    src="/login-bg.jpg"
                    alt="Background Anatomy"
                    fill
                    className="object-cover opacity-90"
                    priority
                    quality={100}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-transparent" />
                <div className="absolute top-0 right-0 h-full w-2/3 bg-gradient-to-l from-slate-950 via-slate-950/60 to-transparent z-10" />

                <div className="absolute bottom-0 left-0 p-12 z-10 text-white w-full">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-6 backdrop-blur-md">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Acesso Antecipado
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Junte-se ao Axiom</h2>
                    <p className="text-slate-300 text-lg max-w-md leading-relaxed">
                        Comece hoje a transformar a gestão da sua clínica com tecnologia biomecânica de ponta.
                    </p>
                </div>
            </div>

            {/* Right Side - Form (50% width) */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 h-screen overflow-y-auto">
                <div className="w-full max-w-lg space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">

                    {/* Header */}
                    <div className="flex flex-col items-center text-center space-y-2">
                        <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/40 mb-4 ring-1 ring-white/10">
                            <Brain className="text-white w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Criar Conta</h1>
                        <p className="text-slate-400 text-lg">
                            Comece sua jornada no Axiom
                        </p>
                    </div>

                    {/* Form Container */}
                    <div className="bg-slate-900/50 border border-slate-800 p-8 md:p-10 rounded-3xl shadow-2xl backdrop-blur-sm">
                        <Suspense>
                            <SignupForm error={error} />
                        </Suspense>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center text-xs text-slate-600">
                        &copy; 2026 Access Fisioterapia. Todos os direitos reservados.
                    </div>
                </div>
            </div>
        </div>
    )
}
