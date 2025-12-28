import { validateFollowupToken } from '@/app/dashboard/patients/actions/followup'
import { PublicAssessmentForm } from './PublicAssessmentForm'
import { AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PublicAssessmentPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params

    // Validate Token
    const result = await validateFollowupToken(token)

    if (!result.success || !result.data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 font-sans">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-sm text-center">
                    <div className="bg-red-100 p-3 rounded-full w-fit mx-auto mb-4">
                        <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800 mb-2">Link Inválido ou Expirado</h1>
                    <p className="text-slate-500 text-sm">
                        {result.error || "Este link de avaliação não está mais disponível."}
                    </p>

                    {/* Debug Details */}
                    <details className="mt-8 text-left border rounded p-2 bg-slate-50 text-[10px] text-slate-500 w-full">
                        <summary className="cursor-pointer mb-2 font-medium">Detalhes Técnicos (Debug)</summary>
                        <pre className="whitespace-pre-wrap break-all">
                            {JSON.stringify({ token, error: result.error, success: result.success }, null, 2)}
                        </pre>
                    </details>

                    <p className="text-xs text-slate-400 mt-6">
                        Entre em contato com seu fisioterapeuta para solicitar um novo link.
                    </p>
                </div>
            </div>
        )
    }

    const item = result.data

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <PublicAssessmentForm item={item} />
        </div>
    )
}
