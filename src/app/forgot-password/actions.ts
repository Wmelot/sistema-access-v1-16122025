'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function resetPassword(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const origin = (await headers()).get('origin')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/update-password`,
    })

    if (error) {
        redirect('/forgot-password?error=Não foi possível enviar o email de recuperação. Tente novamente.')
    }

    redirect('/forgot-password?message=Verifique seu email para redefinir sua senha.')
}
