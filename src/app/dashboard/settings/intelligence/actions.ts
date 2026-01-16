'use server'

import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

import { CLINICAL_PROTOCOLS } from '@/lib/data/clinical-protocols'
import { ORTHOTICS_PROTOCOLS } from '@/lib/data/orthotics-protocols'

export async function getProtocols() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    let dbProtocols = []
    try {
        // [FIX] Use direct DB query to bypass Supabase PGRST205 Schema Cache errors
        const { rows } = await db.query(`
            SELECT * FROM public.clinical_protocols
            ORDER BY is_custom ASC, title ASC
        `)
        dbProtocols = JSON.parse(JSON.stringify(rows))
    } catch (error) {
        console.error("CRITICAL DB ERROR (Protocols):", error)
    }

    // Map System Protocols (Static Files) to UI Format
    const systemClinical = CLINICAL_PROTOCOLS.map(p => ({
        id: p.id,
        title: p.patologia,
        region: p.regiao,
        evidence_sources: p.fontes_evidencia,
        description: p.resumo_clinico,
        interventions: p.intervencoes,
        is_custom: false,
        is_active: true,
        created_at: p.ultima_atualizacao
    }))

    const systemOrthotics = ORTHOTICS_PROTOCOLS.map(p => ({
        id: p.id,
        title: p.patologia,
        region: "Pé e Tornozelo (Biomecânica)",
        evidence_sources: p.base_conhecimento,
        description: p.visualizacao_paciente.explicacao,
        interventions: [
            {
                tipo: "Prescrição de Palmilha",
                categoria: "Órtese Biomecânica",
                conduta_sugerida: p.prescricao_biomecanica.elementos_sugeridos.join(". "),
                dosagem: p.indicacao_palmilha,
                dados_tecnicos: { nivel_evidencia: "Diretriz Clínica" },
                visualizacao_paciente: p.visualizacao_paciente
            }
        ],
        is_custom: false,
        is_active: true,
        created_at: new Date().toISOString()
    }))

    // Combine: Database (Custom) + System (Static)
    // Note: If DB has a copy of system protocol, preferred DB (user override) - logic can be added later
    return [...systemClinical, ...systemOrthotics, ...dbProtocols]
}

export async function createProtocol(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    const title = formData.get('title') as string
    const region = formData.get('region') as string
    const description = formData.get('description') as string
    const evidenceRaw = formData.get('evidence_sources') as string

    // Parse evidence sources (comma separated or newlines)
    // Structure: { citation: string, url?: string }
    const evidence_sources = evidenceRaw.split('\n')
        .map(s => s.trim())
        .filter(Boolean)
        .map(s => ({ citation: s, url: null }))

    const newProtocol = {
        title,
        region,
        description,
        evidence_sources,
        is_custom: true,
        is_active: true,
        user_id: user.id
    }

    const { error } = await supabase
        .from('clinical_protocols')
        .insert(newProtocol)

    if (error) throw new Error(error.message)

    revalidatePath('/dashboard/settings')
    return { success: true }
}

export async function toggleProtocolStatus(id: string, isActive: boolean) {
    const supabase = await createClient()

    // This will only work for rows the user is allowed to update (Own Custom Protocols)
    // Attempting to update system protocols will likely result in RLS policy violation or 0 rows modified (if using 'using' policy).
    const { error } = await supabase
        .from('clinical_protocols')
        .update({ is_active: isActive })
        .eq('id', id)

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/settings')
}

export async function deleteProtocol(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('clinical_protocols')
        .delete()
        .eq('id', id)

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/settings')
}
