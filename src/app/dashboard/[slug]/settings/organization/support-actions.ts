'use server'

import { db } from "@/lib/db"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function toggleSupportAccess(orgId: string, active: boolean, hours: number = 4) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: "Não autenticado" }

        // Check if user is admin of the org (Security)
        const userRes = await db.query(
            `SELECT role, organization_id FROM public.profiles WHERE id = $1`,
            [user.id]
        )
        const userProfile = userRes.rows[0]

        if (userProfile.role !== 'admin' || userProfile.organization_id !== orgId) {
            return { error: "Apenas administradores podem conceder acesso de suporte." }
        }

        const until = active ? new Date(Date.now() + hours * 60 * 60 * 1000).toISOString() : null

        await db.query(
            `UPDATE public.organizations 
             SET support_access_active = $1, support_access_until = $2 
             WHERE id = $3`,
            [active, until, orgId]
        )

        revalidatePath(`/dashboard/[slug]/settings/organization`)
        return { success: true, until }

    } catch (e: any) {
        // If columns don't exist, we need to create them. 
        // This is a "lazy migration" approach since I can't run raw SQL easily via a tool.
        if (e.message.includes("column \"support_access_active\" does not exist")) {
            try {
                await db.query(`ALTER TABLE public.organizations ADD COLUMN support_access_active BOOLEAN DEFAULT FALSE`);
                await db.query(`ALTER TABLE public.organizations ADD COLUMN support_access_until TIMESTAMPTZ`);
                // Retry
                return toggleSupportAccess(orgId, active, hours)
            } catch (innerE: any) {
                return { error: "Erro ao atualizar esquema do banco: " + innerE.message }
            }
        }
        return { error: "Erro ao alternar acesso de suporte: " + e.message }
    }
}

export async function getSupportStatus(orgId: string) {
    try {
        const orgRes = await db.query(
            `SELECT support_access_active, support_access_until FROM public.organizations WHERE id = $1`,
            [orgId]
        )
        return { status: orgRes.rows[0] }
    } catch (e) {
        return { error: "Erro ao buscar status de suporte" }
    }
}
