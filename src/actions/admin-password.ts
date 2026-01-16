'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import bcrypt from 'bcryptjs'
import { db } from "@/lib/db"

export async function setAdminPassword(password: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Usuário não autenticado' }
    }

    // Hash the password for security
    const hashedPassword = await bcrypt.hash(password, 10)

    try {
        await db.query('UPDATE profiles SET admin_password = $1 WHERE id = $2', [hashedPassword, user.id])
    } catch (e: any) {
        console.error("Error setting admin password:", e)
        return { error: 'Erro ao definir senha administrativa' }
    }

    revalidatePath('/dashboard/professionals')
    return { success: true }
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    try {
        const { rows } = await db.query('SELECT admin_password FROM profiles WHERE id = $1', [user.id])
        const profile = rows[0]

        if (!profile?.admin_password) return false

        // Compare hashed password
        return await bcrypt.compare(password, profile.admin_password)
    } catch (e) {
        console.error("Error verifying admin password:", e)
        return false
    }
}
