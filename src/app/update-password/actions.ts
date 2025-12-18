'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updatePassword(formData: FormData) {
    const supabase = await createClient()
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
        redirect('/update-password?error=As senhas não coincidem')
    }

    const { error } = await supabase.auth.updateUser({
        password: password
    })

    if (error) {
        redirect('/update-password?error=Não foi possível atualizar a senha')
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard?message=Senha atualizada com sucesso')
}
