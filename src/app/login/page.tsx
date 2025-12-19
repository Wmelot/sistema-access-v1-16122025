import { LoginForm } from './login-form'
import Image from 'next/image'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; message?: string }>
}) {
    const params = await searchParams
    return (
        <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-white py-12">
            {/* Background Image - Flipped horizontally */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/login-bg-final.jpg"
                    alt="Access Fisio Background"
                    fill
                    className="object-cover"
                    priority
                    quality={100}
                />
            </div>

            {/* Overlay Gradient (Optional, for better text readability if needed) */}
            {/* <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 z-0 pointer-events-none" /> */}

            {/* Content Container - Aligned to Right via flex-end on desktop */}
            <div className="relative z-10 w-full px-4 lg:px-0 flex justify-center lg:justify-end">
                <div className="w-full max-w-sm lg:mr-32 space-y-8 bg-white/0 p-0 sm:p-8 rounded-xl backdrop-blur-none">
                    <div className="flex flex-col space-y-2 text-center lg:text-left">
                        {/* Logo removed as per user request (present in background) */}
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                            Acesse sua conta
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Digite suas credenciais para continuar
                        </p>
                    </div>

                    <div className="grid gap-6">
                        <LoginForm error={params?.error} message={params?.message} />
                    </div>
                </div>
            </div>
        </div>
    )
}
