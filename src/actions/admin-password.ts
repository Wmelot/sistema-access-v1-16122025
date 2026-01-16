'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import bcrypt from 'bcryptjs'

export async function setAdminPassword(password: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Usuário não autenticado' }
    }

    // Hash the password for security
    const hashedPassword = await bcrypt.hash(password, 10)

    const { error } = await supabase
        .from('profiles')
        .update({ admin_password: hashedPassword })
        .eq('id', user.id)

    if (error) {
        return { error: 'Erro ao definir senha administrativa' }
    }

    revalidatePath('/dashboard/professionals')
    return { success: true }
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    const { data: profile } = await supabase
        .from('profiles')
        .select('admin_password')
        .eq('id', user.id)
        .single()

    if (!profile?.admin_password) return false

    // Compare hashed password
    return await bcrypt.compare(password, profile.admin_password)
}
