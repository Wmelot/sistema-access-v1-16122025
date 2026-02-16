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
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 font-sans text-slate-800">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-sm text-center">
                    <div className="bg-red-50 p-3 rounded-full w-fit mx-auto mb-4">
                        <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <h1 className="text-xl font-bold mb-2">Link não disponível</h1>
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
