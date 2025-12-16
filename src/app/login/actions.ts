'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logAction } from '@/lib/logger'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string



    // ...

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        redirect('/login?error=Could not authenticate user')
    }

    // [NEW] Audit Log
    await logAction('Login de Usuário', { email, timestamp: new Date().toISOString() })

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

import { z } from 'zod'

const signupSchema = z.object({
    email: z.string().email(),
    password: z.string()
        .min(8, 'A senha deve ter pelo menos 8 caracteres')
        .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
        .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula')
        .regex(/[0-9]/, 'A senha deve conter pelo menos um número')
        .regex(/[^A-Za-z0-9]/, 'A senha deve conter pelo menos um caractere especial')
        .refine((val) => !/(012|123|234|345|456|567|678|789|987|876|765|654|543|432|321|210)/.test(val), {
            message: 'A senha não pode conter sequências numéricas óbvias (ex: 123, 789)'
        })
})

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // [NEW] Password Validation
    const validation = signupSchema.safeParse({ email, password })

    if (!validation.success) {
        // Extract first error message
        const errorMessage = validation.error.issues[0].message
        redirect(`/login?error=${encodeURIComponent(errorMessage)}`)
    }

    const { error } = await supabase.auth.signUp({
        email,
        password,
    })

    if (error) {
        redirect('/login?error=Could not create user')
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}
