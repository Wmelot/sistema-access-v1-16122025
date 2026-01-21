'use server'

import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'


export async function createAssessment(patientId: string, type: string, data: any, scores: any, title?: string, slug?: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // 1. Fetch User Organization
    const { data: userProfile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()

    let organizationId = userProfile?.organization_id

    // 1.5 If slug provided, override/verify organization
    if (slug) {
        const { data: orgData } = await supabase.from('organizations').select('id').eq('slug', slug).single()
        if (orgData) organizationId = orgData.id
    }

    // 2. Fetch Patient Profile (as fallback if somehow still missing, but slug/user usually enough)
    if (!organizationId) {
        const { data: patientData } = await supabase.from('patients').select('organization_id').eq('id', patientId).single()
        organizationId = patientData?.organization_id
    }

    // Log de aviso se ainda for nulo, mas permite continuar
    if (!organizationId) {
        console.warn('[createAssessment] Salvando sem contexto de organização. Prof:', user.id, 'Paciente:', patientId)
    }

    const payload = {
        patient_id: patientId,
        professional_id: user.id,
        organization_id: organizationId, // Explicit Tenant ID
        type,
        title: title || type,
        data,
        scores: {
            ...scores,
            savedAt: new Date().toISOString()
        }
    }

    // db query bypass to avoid schema cache issues (PGRST204)
    try {
        await db.query(`
            INSERT INTO public.patient_assessments 
            (patient_id, professional_id, organization_id, type, title, data, scores, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        `, [
            patientId,
            user.id,
            organizationId,
            type,
            title || type,
            payload.data, // jsonb
            payload.scores // jsonb
        ])
    } catch (error: any) {
        console.error('Error creating assessment (DB):', error)
        throw new Error(`Failed to create assessment: ${error.message}`)
    }

    if (slug) {
        revalidatePath(`/dashboard/${slug}/patients`)
        revalidatePath(`/dashboard/${slug}/patients/${patientId}`)
    } else {
        revalidatePath('/dashboard/patients')
        revalidatePath(`/dashboard/patients/${patientId}`)
    }
}


export async function getAssessments(patientId: string, slug?: string) {
    const supabase = await createClient()

    let query = supabase
        .from('patient_assessments')
        .select(`
            *,
            profiles (
                full_name
            )
        `)
        .eq('patient_id', patientId)

    if (slug) {
        const { data: orgData } = await supabase.from('organizations').select('id').eq('slug', slug).single()
        if (orgData?.id) {
            query = query.eq('organization_id', orgData.id)
        }
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching assessments:', error)
        return []
    }

    // Map to ensure 'title' exists and match UI expectations if needed, but mostly raw return is fine
    // as per original code.
    return data || []
}
