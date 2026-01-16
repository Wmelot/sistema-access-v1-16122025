
import { LoginForm } from './login-form'
import Image from 'next/image'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; message?: string }>
}) {
    const params = await searchParams
    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
            {/* Background Image - Full Screen */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/login-bg.jpg"
                    alt="Background"
                    fill
                    className="object-cover"
                    priority
                    quality={100}
                />
                {/* Optional Overlay for readability */}
                <div className="absolute inset-0 bg-black/30" />
            </div>

            {/* Login Card - Glassmorphism */}
            <div className="relative z-10 w-full max-w-[400px] p-4">
                <div className="w-full rounded-xl border border-white/20 bg-white/80 p-8 shadow-2xl backdrop-blur-md dark:bg-black/60">
                    <div className="mb-6 flex flex-col items-center gap-2 text-center">
                        <div className="bg-indigo-600 text-white font-bold p-2 text-xl rounded-lg shadow-lg">
                            Axiom
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Acesse sua conta</h1>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Bem-vindo de volta!
                        </p>
                    </div>

                    <LoginForm error={params?.error} message={params?.message} />

                    <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                        Não tem uma conta?{" "}
                        <a href="/auth/signup-clinic" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                            Cadastre sua clínica
                        </a>
                    </div>
                </div>

                {/* Footer / Credits */}
                <div className="mt-8 text-center text-xs text-white/70">
                    &copy; 2026 Access Fisioterapia. Todos os direitos reservados.
                </div>
            </div>
        </div>
    )
}
