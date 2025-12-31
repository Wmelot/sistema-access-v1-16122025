
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        const supabase = createAdminClient()

        // 1. Mock Data for STarT Back High Risk (Long String)
        const patientId = '151d70d0-2e12-4f64-8776-619b5b91d9d4' // Known valid ID

        // Ensure patient exists (optional check, skipping for speed)

        const payload = {
            patient_id: patientId,
            professional_id: '980eac0e-a581-430e-b35c-b95f51761c5d', // Known valid professional from logs
            type: 'start_back',
            title: 'DEBUG TEST STarT Back',
            data: { q1: 1, q2: 1, q3: 1, q4: 1, q5: 1, q6: 1, q7: 1, q8: 1, q9: 4 },
            scores: {
                total: 9,
                psychosocial: 5,
                classification: "Alto Risco Psicossocial", // 23 chars
                riskColor: "red",
                savedAt: new Date().toISOString()
            }
        }

        console.log('[Debug] Attempting Insert:', JSON.stringify(payload, null, 2))

        const { data, error } = await supabase.from('patient_assessments').insert(payload).select()

        if (error) {
            console.error('[Debug] Insert Error:', error)
            return NextResponse.json({ success: false, error: error.message, code: error.code, details: error.details })
        }

        return NextResponse.json({ success: true, data })

    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message, stack: e.stack })
    }
}
