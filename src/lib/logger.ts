'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function logAction(action: string, details: any, entity?: string, entityId?: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    // Opcional: Pegar IP dos headers se necessário (no Next.js pode ser chato em server actions puras)

    if (!user) {
        console.error("Tentativa de log sem usuário autenticado", action)
        return
    }

    const { error } = await supabase
        .from('system_logs')
        .insert({
            user_id: user.id,
            action,
            details,
            entity,
            entity_id: entityId
        })

    if (error) {
        console.error("Erro ao gravar log:", error)
    }
}

export async function getLogs() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('system_logs')
        .select('*, users:user_id(email)') // Assumindo que queremos o email do user
        .order('created_at', { ascending: false })
        .limit(50)

    if (error) {
        console.error("Erro ao buscar logs:", error)
        return []
    }

    return data
}
