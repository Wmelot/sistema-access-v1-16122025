"use server"

import { createClient } from "@/lib/supabase/server"
import { hasPermission } from "@/lib/rbac"
import { revalidatePath } from "next/cache"

export async function getRoles() {
    // Anyone auth can view roles (policy), but we wrap nicely
    const supabase = await createClient()
    const { data: roles, error } = await supabase
        .from('roles')
        .select('*')
        .order('name', { ascending: true })

    if (error) throw new Error(error.message)
    return roles
}

export async function getRole(id: string) {
    const supabase = await createClient()
    const { data: role, error } = await supabase
        .from('roles')
        .select(`
            *,
            permissions:role_permissions(permission_id, permissions(code, description, module))
        `)
        .eq('id', id)
        .single()

    if (error) return null
    return role
}

export async function getAllPermissions() {
    const supabase = await createClient()
    const { data: permissions, error } = await supabase
        .from('permissions')
        .select('*')
        .order('module', { ascending: true })
        .order('code', { ascending: true })

    if (error) throw new Error(error.message)
    return permissions
}

export async function createRole(formData: FormData) {
    const canManage = await hasPermission('roles.manage')
    if (!canManage) return { error: "Sem permissão para criar perfis." }

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const permissionIds = formData.get('permissions')?.toString().split(',') || []

    if (!name) return { error: "Nome é obrigatório" }

    const supabase = await createClient()

    // 1. Create Role
    const { data: role, error } = await supabase
        .from('roles')
        .insert({ name, description })
        .select()
        .single()

    if (error) return { error: "Erro ao criar perfil. Verifique se o nome já existe." }

    // 2. Assign Permissions
    if (permissionIds.length > 0) {
        const inserts = permissionIds.map(pid => ({
            role_id: role.id,
            permission_id: pid
        }))

        const { error: permError } = await supabase
            .from('role_permissions')
            .insert(inserts)

        if (permError) return { error: "Perfil criado, mas erro ao atribuir permissões." }
    }

    revalidatePath('/dashboard/settings/roles')
    return { success: true }
}

export async function updateRole(roleId: string, formData: FormData) {
    const canManage = await hasPermission('roles.manage')
    if (!canManage) return { error: "Sem permissão para editar perfis." }

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const permissionIds = formData.get('permissions')?.toString().split(',') || []

    const supabase = await createClient()

    // 1. Update Role Info
    const { error } = await supabase
        .from('roles')
        .update({ name, description })
        .eq('id', roleId)

    if (error) return { error: "Erro ao atualizar perfil." }

    // 2. Update Permissions (Delete all + Re-insert) 
    // Transaction-like behavior not fully trivial in simple client, but sequential ok for now
    await supabase.from('role_permissions').delete().eq('role_id', roleId)

    if (permissionIds.length > 0 && permissionIds[0] !== "") {
        const inserts = permissionIds.map(pid => ({
            role_id: roleId,
            permission_id: pid
        }))
        await supabase.from('role_permissions').insert(inserts)
    }

    revalidatePath('/dashboard/settings/roles')
    return { success: true }
}

export async function deleteRole(roleId: string, password?: string) {
    const canManage = await hasPermission('roles.manage')

    // We also want to enforce critical check. 
    // Usually 'roles.manage' is high priv, but let's stick to pattern of checking password auth.
    if (!canManage) return { error: "Sem permissão." }

    // 1. Verify Password
    const supabase = await createClient()

    if (password) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user && user.email) {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: password
            })
            if (signInError) {
                return { error: 'Senha incorreta' }
            }
        } else {
            return { error: 'Usuário não autenticado' }
        }
    } else {
        return { error: 'Senha necessária para deletar' }
    }

    // Check if system role
    const { data: role } = await supabase.from('roles').select('is_system').eq('id', roleId).single()
    if (role?.is_system) return { error: "Perfis de sistema não podem ser excluídos." }

    const { error } = await supabase.from('roles').delete().eq('id', roleId)
    if (error) return { error: "Erro ao excluir perfil. Pode haver usuários vinculados." }

    revalidatePath('/dashboard/settings/roles')
    return { success: true }
}
