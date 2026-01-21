'use server'

import { db } from "@/lib/db"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getOrganizationSettings(slug?: string) {
    try {
        const supabase = await createClient()
        // 1. Get User ID
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: "Não autenticado" }

        // 2. Get User's Org ID (Direct DB Call)
        const userRes = await db.query(
            `SELECT organization_id FROM public.profiles WHERE id = $1`,
            [user.id]
        )
        let orgId = userRes.rows[0]?.organization_id

        if (slug) {
            const orgRes = await db.query(
                `SELECT id FROM public.organizations WHERE slug = $1`,
                [slug]
            )
            if (orgRes.rows[0]) {
                orgId = orgRes.rows[0].id
            }
        }

        if (!orgId) return { error: "Usuário sem organização vinculada." }

        // 3. Get Org Data
        const orgRes = await db.query(
            `SELECT * FROM public.organizations WHERE id = $1`,
            [orgId]
        )

        return { org: orgRes.rows[0] }

    } catch (e: any) {
        console.error("Error fetching org settings:", e)
        return { error: "Erro ao buscar configurações." }
    }
}

export async function updateOrganizationSettings(formData: FormData, slug?: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: "Não autenticado" }

        // Get Org ID
        const userRes = await db.query(
            `SELECT organization_id FROM public.profiles WHERE id = $1`,
            [user.id]
        )
        let orgId = userRes.rows[0]?.organization_id

        if (slug) {
            const orgRes = await db.query(
                `SELECT id FROM public.organizations WHERE slug = $1`,
                [slug]
            )
            if (orgRes.rows[0]) {
                orgId = orgRes.rows[0].id
            }
        }

        if (!orgId) return { error: "Usuário sem organização." }

        const name = formData.get('name') as string
        const primary_color = formData.get('primary_color') as string
        const logo_url = formData.get('logo_url') as string
        const google_place_id = formData.get('google_place_id') as string

        // Validate
        if (!name) return { error: "Nome é obrigatório." }

        // Update (Direct DB)
        await db.query(
            `UPDATE public.organizations 
             SET name = $1, primary_color = $2, logo_url = $3, google_place_id = $4, updated_at = NOW() 
             WHERE id = $5`,
            [name, primary_color, logo_url || null, google_place_id || null, orgId]
        )

        revalidatePath('/dashboard')
        return { success: true }

    } catch (e: any) {
        console.error("Error updating org settings:", e)
        return { error: "Erro ao salvar configurações." }
    }
}
