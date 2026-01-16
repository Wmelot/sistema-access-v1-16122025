'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logAction } from '@/lib/logger'

export async function login(formData: FormData) {
    const remember = formData.get('remember') === 'on'
    const cookieOptions = remember ? { maxAge: 60 * 60 * 24 * 30 } : {} // 30 days

    // Pass cookie options to apply to session cookies
    const supabase = await createClient(cookieOptions)

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // [UPDATED] Secure Bypass Logic
    try {
        const { verifyUserPassword } = await import('@/lib/auth-bypass');
        const authResult = await verifyUserPassword(email, password);

        if (authResult.error) {
            console.error('Login Failed:', authResult.error);
            redirect(`/login?error=${encodeURIComponent(authResult.error)}`);
        }

        const user = authResult.user;
        if (user) {
            console.log('✅ Custom Auth Success:', user.email);

            // Set Custom Session Cookie
            const { cookies } = await import('next/headers');
            const cookieStore = await cookies();
            cookieStore.set('axiom_user', JSON.stringify({
                id: user.id,
                email: user.email,
                full_name: user.meta?.full_name || 'Usuário'
            }), {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 7, // 7 days
                path: '/'
            });

            // Redirect based on user
            if (email === 'accessfisio@gmail.com') {
                redirect('/admin');
            } else {
                redirect('/dashboard');
            }
        }
    } catch (err: any) {
        if (err.message === 'NEXT_REDIRECT') throw err;
        console.error('Auth Unexpected Error:', err);
        redirect(`/login?error=Erro inesperado: ${err.message}`);
    }
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

    /* // BYPASS: DISABLE REAL AUTH
    const { error } = await supabase.auth.signUp({
        email,
        password,
    })

    if (error) {
        redirect('/login?error=Could not create user')
    }
    */

    console.warn('⚠️ SERVER ACTION BYPASS: Redirecting to dashboard...');
    redirect('/dashboard')
}
