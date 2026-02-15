'use server'

import { revalidatePath } from 'next/cache'

export async function createAssessment(patientId: string, type: string, data: any, scores: any, title?: string, slug?: string) {
    const { createClient, createAdminClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const adminSupabase = await createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // 1. Basic patient ID validation
    if (!patientId || patientId === 'sandbox') {
        console.warn('[createAssessment] Skipping persistence: sandbox mode or missing patientId');
        return { success: false, msg: 'Modo Sandbox: Histórico não persistido' }
    }

    let organizationId: string | null = null;

    try {
        // 2. Resolve Organization ID
        // Priority 1: Profile Org
        const { data: userProfile } = await adminSupabase.from('profiles').select('organization_id').eq('id', user.id).single()
        organizationId = userProfile?.organization_id || null

        // Priority 2: Slug match
        if (!organizationId && slug) {
            const { data: orgData } = await adminSupabase.from('organizations').select('id').eq('slug', slug).single()
            if (orgData) organizationId = orgData.id
        }

        // Priority 3: Fallback to patient's own organization
        if (!organizationId) {
            const { data: patientData } = await adminSupabase
                .from('patients')
                .select('organization_id')
                .eq('id', patientId)
                .maybeSingle()
            organizationId = patientData?.organization_id || null
        }

        const payload = {
            patient_id: patientId,
            professional_id: user.id,
            organization_id: organizationId,
            type,
            title: title || type,
            data: data || {},
            scores: {
                ...(scores || {}),
                savedAt: new Date().toISOString()
            }
        }

        console.log('[createAssessment] Attempting insert with payload:', {
            patient: patientId,
            org: organizationId,
            type
        });

        const { error: insertError } = await adminSupabase
            .from('patient_assessments')
            .insert(payload)

        if (insertError) {
            console.error('[createAssessment] Insert Error:', insertError);
            throw insertError;
        }

        if (slug) {
            revalidatePath(`/dashboard/${slug}/patients`)
            revalidatePath(`/dashboard/${slug}/patients/${patientId}`)
        }

        return { success: true }
    } catch (error: any) {
        console.error('Error creating assessment:', error)
        return { success: false, msg: error.message || 'Erro ao salvar no histórico do paciente.' }
    }
}


export async function getAssessments(patientId: string, slug?: string) {
    const { createClient } = await import('@/lib/supabase/server')
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

    return data || []
}
