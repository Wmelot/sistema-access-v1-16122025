import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    const supabase = await createClient()
    const serviceRoleSupabase = await createClient() // We really need Admin access ideally, but `createClient` here is likely using standard keys. 
    // If we can't get admin access, we depend on SignUp acting as "create if not exists".
    // However, Supabase `signUp` on an existing user usually just returns the user (if email confirmation is off) OR errors.
    // We want to FORCE a password reset. 

    // Since we don't have the service_role key exposed commonly in client code (it shouldn't be), 
    // we might be limited. But let's try to just use SignUp. 
    // If the user exists, SignUp usually *doesn't* update the password unless it's a specific flow.

    // Strategy: We can't easily force-update password without service role. 
    // But we can delete the user if we had access? No.

    // Let's rely on the user NOT existing because of the previous `db reset`. 
    // If the user says "Could not authenticate", maybe the user DOES exist but with a different password (from an earlier run?).

    // Let's try to be clever: The /setup route previously might have failed or the user didn't wait.
    // I will add a check to basic SignUp.

    const users = [
        {
            email: 'accessfisio@gmail.com',
            password: 'Axiom@2026!Password',
            full_name: 'Axiom Master',
        },
        {
            email: 'wmelot@gmail.com',
            password: 'Axiom@2026!Password',
            full_name: 'Dr. Warley',
        }
    ]

    const results = []

    for (const user of users) {
        // Attempt Sign Up
        const { data, error } = await supabase.auth.signUp({
            email: user.email,
            password: user.password,
            options: {
                data: {
                    full_name: user.full_name,
                }
            }
        })

        if (error) {
            results.push(`Erro: ${error.message}`)
        } else if (data.user?.identities?.length === 0) {
            // Identity length 0 means user already exists.
            // We can't update password easily here without sending a reset email or having service role.
            results.push(`⚠️ Usuário ${user.email} já existe! A senha NÃO foi alterada. Se você não sabe a senha, precisaremos deletar o usuário via banco.`)
        } else {
            results.push(`✅ Sucesso: ${user.email} criado/atualizado!`)
        }
    }

    return NextResponse.json({
        status: 'Setup Attempted',
        results: results,
        instruction: 'Se aparecer "Usuário já existe" e o login falhar, precisamos rodar o comando de reset do banco de novo.'
    })
}
