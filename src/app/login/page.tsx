
import { LoginForm } from './login-form'
import Image from 'next/image'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; message?: string }>
}) {
    const params = await searchParams
    return (
        <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
            <div className="flex items-center justify-center py-12">
                <div className="mx-auto grid w-[350px] gap-6">
                    <div className="grid gap-2 text-center">
                        <div className="flex justify-center mb-4">
                            {/* Brand Logo Placeholder if needed, but text mentions 'Access' */}
                            <div className="bg-indigo-600 text-white font-bold p-2 text-xl rounded-lg">Axiom</div>
                        </div>
                        <h1 className="text-3xl font-bold">Acesse sua conta</h1>
                        <p className="text-balance text-muted-foreground">
                            Digite seu email abaixo para entrar na sua conta
                        </p>
                    </div>
                    <LoginForm error={params?.error} message={params?.message} />
                    <div className="mt-4 text-center text-sm">
                        Não tem uma conta?{" "}
                        <a href="/auth/signup-clinic" className="underline">
                            Cadastre sua clínica
                        </a>
                    </div>
                </div>
            </div>
            <div className="hidden bg-muted lg:block relative h-full">
                <Image
                    src="/login-bg-final.jpg"
                    alt="Anatomia e Fisioterapia"
                    fill
                    className="object-cover dark:brightness-[0.8]"
                    priority
                    quality={100}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/60 to-transparent flex items-end p-10">
                    <div className="text-white">
                        <h3 className="text-2xl font-semibold">Tecnologia avançada para fisioterapia</h3>
                        <p className="mt-2 text-indigo-100">Gerencie sua clínica com precisão e inteligência.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
