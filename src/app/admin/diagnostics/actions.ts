'use server'

import { createAdminClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"

export async function runGlobalDiagnostic() {
    const supabase = await createAdminClient()
    const report: any[] = []

    try {
        // 1. Fetch all active organizations
        const { data: orgs, error: orgErr } = await supabase
            .from('organizations')
            .select('id, name, slug, status')
            .neq('status', 'deleted')
            .order('name')

        if (orgErr) throw orgErr

        for (const org of orgs) {
            const orgResults: any[] = []

            // Check Critical Metrics
            const { count: patients } = await supabase
                .from('patients')
                .select('id', { count: 'exact', head: true })
                .eq('organization_id', org.id)

            const { count: professionals } = await supabase
                .from('profiles')
                .select('id', { count: 'exact', head: true })
                .eq('organization_id', org.id)

            const { count: appointments } = await supabase
                .from('appointments')
                .select('id', { count: 'exact', head: true })
                .eq('organization_id', org.id)

            // Diagnostic Checks
            // 2. Check for broken appointments (missing patient or pro)
            const { count: brokenAppts } = await supabase
                .from('appointments')
                .select('id', { count: 'exact', head: true })
                .eq('organization_id', org.id)
                .or('professional_id.is.null,patient_id.is.null')

            if (brokenAppts && brokenAppts > 0) {
                orgResults.push({
                    type: 'error',
                    message: `${brokenAppts} agendamentos corrompidos (sem vínculo).`,
                    action: 'Recomendado limpeza via script de suporte.'
                })
            }

            // 3. Check for appointments without organization_id (orphans)
            // Note: This check is global but we filter by current known appts for this org context
            // Actually, if an appt has NO org_id, it won't appear here.

            // 4. Check for profiles without organization_id
            const { count: orphanedProfiles } = await supabase
                .from('profiles')
                .select('id', { count: 'exact', head: true })
                .is('organization_id', null)
            // Filter logic here would be tricky if they are truly orphaned.
            // But for global report, we can check it once.

            report.push({
                orgId: org.id,
                name: org.name,
                slug: org.slug,
                status: org.status,
                metrics: { patients, professionals, appointments },
                issues: orgResults
            })
        }

        // Global System Check
        const { count: totalOrphanedPatients } = await supabase
            .from('patients')
            .select('id', { count: 'exact', head: true })
            .is('organization_id', null)

        const { count: totalOrphanedAppointments } = await supabase
            .from('appointments')
            .select('id', { count: 'exact', head: true })
            .is('organization_id', null)

        return {
            timestamp: new Date().toISOString(),
            organizations: report,
            globalIssues: {
                orphanedPatients: totalOrphanedPatients || 0,
                orphanedAppointments: totalOrphanedAppointments || 0
            }
        }

    } catch (e: any) {
        console.error("[Global Diagnostic] Error:", e)
        return { error: e.message }
    }
}

export async function cleanupOrphanedData(type: 'patients' | 'appointments') {
    const supabase = await createAdminClient()

    try {
        if (type === 'patients') {
            const { error } = await supabase.from('patients').delete().is('organization_id', null)
            if (error) throw error
        } else if (type === 'appointments') {
            const { error } = await supabase.from('appointments').delete().is('organization_id', null)
            if (error) throw error
        }

        return { success: true }
    } catch (e: any) {
        return { error: e.message }
    }
}

export async function cleanupClinicBrokenData(orgId: string) {
    const supabase = await createAdminClient()

    try {
        // Delete appointments for this org where patient_id or professional_id is null
        const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('organization_id', orgId)
            .or('patient_id.is.null,professional_id.is.null')

        if (error) throw error
        return { success: true }
    } catch (e: any) {
        return { error: e.message }
    }
}
