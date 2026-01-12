
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function resetPasswordInd(prevState: any, formData: FormData) {
    const email = formData.get('email') as string
    const supabase = await createClient()
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/dashboard/settings/password`,
    })

    if (error) {
        console.error('Reset Password Error:', error)
        return { error: 'Não foi possível enviar o email de recuperação. Verifique se o endereço está correto.' }
    }

    return { success: 'Verifique seu email para redefinir a senha.' }
}
