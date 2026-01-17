import { SignupForm } from "./signup-form";
import { Suspense } from 'react';

export default async function SignupPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>
}) {
    const { error } = await searchParams
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
            <div className="w-full max-w-sm space-y-6 rounded-lg border bg-white p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Criar Conta</h1>
                    <p className="text-sm text-gray-500">Comece sua jornada no Axiom.</p>
                </div>
                <Suspense>
                    <SignupForm error={error} />
                </Suspense>
            </div>
        </div>
    )
}
