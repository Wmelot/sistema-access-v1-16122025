import { validateFollowupToken } from '@/app/dashboard/[slug]/patients/actions/followup'
import { PublicAssessmentForm } from './PublicAssessmentForm'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function PublicAssessmentPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params

    // 1. Validate Token (Standard Check)
    const result = await validateFollowupToken(token)

    if (!result.success || !result.data) {
        // 2. Secondary Check: Is it already completed?
        const supabase = await createAdminClient()
        const { data: completedData } = await supabase
            .from('assessment_follow_ups')
            .select('*')
            .eq('token', token)
            .single()

        // CASE A: Successfully Completed
        if (completedData && completedData.status === 'completed') {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 font-sans">
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-green-100 max-w-sm text-center">
                        <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-4">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-800 mb-2">Avaliação Já Recebida</h1>
                        <p className="text-green-700 text-sm mb-6">
                            Você já respondeu este questionário anteriormente. As informações já foram salvas em seu prontuário.
                        </p>
                        <p className="text-xs text-slate-400">
                            Caso precise atualizar alguma informação, entre em contato com seu fisioterapeuta.
                        </p>
                    </div>
                </div>
            )
        }

        // CASE B: Actually Invalid or Not Found
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 font-sans">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-sm text-center">
                    <div className="bg-red-50 p-3 rounded-full w-fit mx-auto mb-4">
                        <AlertCircle className="h-8 w-8 text-red-400" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800 mb-2">Link não disponível</h1>
                    <p className="text-slate-500 text-sm">
                        Este link não é mais válido ou expirou.
                    </p>

                    <p className="text-xs text-slate-400 mt-6">
                        Solicite um novo link ao seu fisioterapeuta.
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
