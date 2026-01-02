'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getProtocols() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // Fetch system protocols (is_custom = false) AND user's custom protocols
    // RLS policies should handle visibility, but explicit logic clarifies intent.
    const { data, error } = await supabase
        .from('clinical_protocols')
        .select('*')
        .order('is_custom', { ascending: true }) // System first
        .order('title', { ascending: true })

    if (error) {
        console.error("Error fetching protocols:", error)
        return []
    }

    return data
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
