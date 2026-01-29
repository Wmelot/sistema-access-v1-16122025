'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import slugify from 'slugify'

const signupSchema = z.object({

    email: z.string().email('Email inválido'),
    password: z.string()
        .min(8, 'A senha deve ter pelo menos 8 caracteres')
        .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
        .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula')
        .regex(/[0-9]/, 'A senha deve conter pelo menos um número')
        .regex(/[^A-Za-z0-9]/, 'A senha deve conter pelo menos um caractere especial')
        .refine((val) => !/(012|123|234|345|456|567|678|789|987|876|765|654|543|432|321|210)/.test(val), {
            message: 'A senha não pode conter sequências numéricas óbvias (ex: 123, 789)'
        }),
    fullName: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    clinicName: z.string().min(3, 'Nome da clínica deve ter pelo menos 3 caracteres'),
    phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
    termsAccepted: z.boolean().refine((val) => val === true, {
        message: 'Você deve aceitar os Termos e Condições'
    }),
})

// Schema separado apenas para validar formato de email antes da senha
const emailOnlySchema = z.object({
    email: z.string().email('Email inválido')
})

export async function signup(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const rawData = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        fullName: formData.get('full_name') as string,
        clinicName: formData.get('clinic_name') as string,
        phone: formData.get('phone') as string || null,
        termsAccepted: formData.get('terms') === 'on'
    }

    // 1. PRIORIDADE MÁXIMA: Verificar se email já existe (mesmo antes de validar senha forte)
    // Isso evita que o usuário fique tentando ajustar a senha para um email que nem pode usar.
    const emailValidation = emailOnlySchema.safeParse({ email: rawData.email })

    if (emailValidation.success) {
        // Verificar no Auth Users (fonte da verdade para login)
        // Nota: supabase.auth.admin requer chave de service role, que não temos aqui client-side.
        // Mas podemos tentar buscar no 'profiles' ou tentar um signIn dummy (ruim).
        // Melhor abordagem: buscar na tabela pública 'profiles' que espelha os usuários.

        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('email')
            .eq('email', rawData.email)
            .single()

        if (existingProfile) {
            return { error: 'Este email já possui uma conta. Tente fazer login.' }
        }

        // TRIAL ABUSE CHECK: Verificar se este email já usou o trial antes (mesmo se data foi deletada)
        const { data: trialHistory } = await supabase
            .from('trial_history' as any) // [FIXED] Cast
            .select('created_at')
            .eq('email', rawData.email)
            .single()

        if (trialHistory) {
            return { error: 'Este email já utilizou o período de teste gratuitamente anteriormente.' }
        }
    }

    // 2. Validação completa (agora sim checa senha forte)
    const validation = signupSchema.safeParse(rawData)

    if (!validation.success) {
        const errorMessage = validation.error.issues[0].message
        return { error: errorMessage }
    }

    const { email, password, fullName, clinicName, phone } = validation.data

    // 3. Criar usuário no Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                clinic_name: clinicName,
                phone: phone
            }
        }
    })

    if (signUpError) {
        // Traduzir erros comuns do Supabase
        let msg = signUpError.message
        if (msg.includes("already registered")) msg = "Este email já está cadastrado."
        if (msg.includes("Password should be")) msg = "A senha não atende aos requisitos de segurança."

        return { error: msg }
    }

    const user = authData.user
    if (!user) {
        return { error: 'Erro ao criar usuário no sistema de autenticação.' }
    }

    // 4. SANITIZAÇÃO E ISOLAMENTO TOTAL - Criar organização e profile
    // Use the admin client for all subsequent database operations to ensure they succeed
    const adminSupabase = await createClient() // We'll need the admin client actually
    // Wait, I need specifically the one that bypasses RLS
    const { createAdminClient } = await import('@/lib/supabase/server')
    const supabaseAdmin = await createAdminClient()

    try {
        // A. Criar slug único para a organização
        const baseSlug = slugify(clinicName, { lower: true, strict: true })
        let slug = baseSlug
        let slugCounter = 1

        // Garantir slug único (using admin client)
        while (true) {
            const { data: existingOrg } = await supabaseAdmin
                .from('organizations')
                .select('id')
                .eq('slug', slug)
                .single()

            if (!existingOrg) break
            slug = `${baseSlug}-${slugCounter}`
            slugCounter++
        }

        // B. Buscar plan_config FREE (para trial) (using admin client)
        const { data: freePlanConfig } = await supabaseAdmin
            .from('plan_configs' as any)
            .select('id')
            .eq('plan_type', 'free')
            .single()

        // C. Criar a organização do novo usuário (ISOLADA) (using admin client)
        const { data: newOrg, error: orgError } = await supabaseAdmin
            .from('organizations')
            .insert({
                name: clinicName,
                slug: slug,
                owner_id: user.id,
                plan: 'free',
                plan_config_id: (freePlanConfig as any)?.id || null,
                status: 'active'
            })
            .select('id')
            .single()

        if (orgError) {
            console.error('Erro ao criar organização:', orgError)
            throw new Error(`Falha ao registrar clínica: ${orgError.message}`)
        }

        // D. CRIAR ROLES PADRÃO PARA A NOVA ORGANIZAÇÃO (using admin client)
        const defaultRoles = [
            { name: 'Admin', description: 'Administrador da clínica. Acesso total.', is_system: true, organization_id: newOrg.id },
            { name: 'Profissional', description: 'Profissional de saúde. Acesso à agenda e pacientes.', is_system: true, organization_id: newOrg.id },
            { name: 'Recepcionista', description: 'Gestão de agenda e cadastros básicos.', is_system: true, organization_id: newOrg.id }
        ]

        const { data: createdRoles, error: rolesError } = await supabaseAdmin
            .from('roles')
            .insert(defaultRoles)
            .select('id, name')

        if (rolesError) {
            console.error('Erro ao criar roles padrão:', rolesError)
        }

        const adminRoleId = createdRoles?.find(r => r.name === 'Admin')?.id || null;

        // E. Criar/Atualizar profile do usuário (VINCULADO À SUA ORGANIZAÇÃO) (using admin client)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: user.id,
                email: email,
                full_name: fullName,
                phone: phone,
                organization_id: newOrg.id,
                role_id: adminRoleId,
                role: 'admin',
                created_at: new Date().toISOString()
            })

        if (profileError) {
            console.error('Erro ao criar profile:', profileError)
            throw new Error(`Falha ao configurar perfil de usuário: ${profileError.message}`)
        }

        // F. REGISTRAR HISTÓRICO DE TRIAL (Para evitar abuso futuro)
        await supabaseAdmin
            .from('trial_history' as any)
            .insert({
                email: email,
                phone: phone,
                organization_id: newOrg.id,
                created_at: new Date().toISOString()
            })

        console.log(`✅ Novo usuário criado com sucesso:`, {
            userId: user.id,
            email: email,
            organizationId: newOrg.id,
            organizationName: clinicName,
            plan: 'free'
        })

    } catch (e: any) {
        console.error('Erro no processo de signup:', e)

        // Tentar fazer rollback (deletar usuário do auth se algo deu errado)
        // ESSENCIAL: Usar o clinte admin para deletar o usuário
        try {
            await supabaseAdmin.auth.admin.deleteUser(user.id)
            console.log(`Rollback: Usuário ${user.id} deletado após falha no setup.`);
        } catch (rollbackError) {
            console.error('Erro ao fazer rollback:', rollbackError)
        }

        return { error: e.message || 'Ocorreu um erro ao configurar sua conta.' }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard') // Sucesso = redirect
}
