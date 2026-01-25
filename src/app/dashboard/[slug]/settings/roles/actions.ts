"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { hasPermission } from "@/lib/rbac"
import { revalidatePath } from "next/cache"

// --- HELPERS ---
async function getOrgId() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    return data?.organization_id
}

export async function getRoles() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Fetch user's organization
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    const orgId = profile?.organization_id

    // Use admin client to ensure we get all relevant roles even if policies are restrictive
    const adminSupabase = await createAdminClient()

    let query = adminSupabase.from('roles').select('*')

    if (orgId) {
        // Show system roles OR roles belonging to this org
        query = query.or(`organization_id.eq.${orgId},organization_id.is.null`)
    } else {
        // No org? Only show system roles
        query = query.filter('organization_id', 'is', null)
    }

    const { data: roles, error } = await query.order('name', { ascending: true })

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
    const supabase = await createAdminClient()
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

export async function toggleRolePermission(roleId: string, permissionId: string, grant: boolean) {
    const canManage = await hasPermission('roles.manage')
    if (!canManage) return { error: "Sem permissão." }

    const supabase = await createClient()

    if (grant) {
        // Grant: Insert if not exists
        const { error } = await supabase
            .from('role_permissions')
            .upsert({ role_id: roleId, permission_id: permissionId }, { onConflict: 'role_id,permission_id' })

        if (error) return { error: "Erro ao adicionar permissão." }
    } else {
        // Revoke: Delete
        const { error } = await supabase
            .from('role_permissions')
            .delete()
            .match({ role_id: roleId, permission_id: permissionId })

        if (error) return { error: "Erro ao remover permissão." }
    }

    revalidatePath('/dashboard/settings/permissions') // Update matrix page
    // revalidatePath('/dashboard/settings/roles') // Update roles page too if needed
    return { success: true }
}

export async function getRoleMembers(roleId: string) {
    const supabase = await createClient()
    const orgId = await getOrgId()

    if (!orgId) return []

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role_id')
        .eq('role_id', roleId)
        .eq('organization_id', orgId) // FIX: Security Leak
        .order('full_name')

    if (error) return []
    return profiles
}

export async function getAllProfiles() {
    const supabase = await createClient()
    const orgId = await getOrgId()

    if (!orgId) return []

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role_id, roles(name)')
        .eq('organization_id', orgId) // FIX: Security Leak
        .order('full_name')

    if (error) return []
    return profiles
}

export async function updateRoleMembers(roleId: string, memberIds: string[]) {
    // This function sets the role_id = roleId for the given memberIds.
    // AND it sets role_id = NULL (or default?) for members NOT in the list but currently in the role?
    // User interface logic: "Select users to be in this role".
    // Implication: If I select User A (who was Role X), they become Role Y.
    // If I unselect User B (who was Role Y), they become No Role (or we keep them? usually we remove them from this role).

    // Strategy:
    // 1. Fetch current members of this role.
    // 2. Identify users to ADD (in memberIds, not currently in role).
    // 3. Identify users to REMOVE (in currently role, not in memberIds).

    const canManage = await hasPermission('roles.manage')
    if (!canManage) return { error: "Sem permissão." }

    const supabase = await createClient()

    // 1. Current members
    const { data: currentMembers } = await supabase
        .from('profiles')
        .select('id')
        .eq('role_id', roleId)

    const currentIds = currentMembers?.map(m => m.id) || []

    const toAdd = memberIds.filter(id => !currentIds.includes(id))
    const toRemove = currentIds.filter(id => !memberIds.includes(id))

    // Multi-tenant check for safety: ensure all memberIds belong to the same org
    const orgId = await getOrgId()
    if (!orgId) return { error: "Sessão expirada." }

    // 2. Add (Update their role_id to this role)
    if (toAdd.length > 0) {
        const { error: addError } = await supabase
            .from('profiles')
            .update({ role_id: roleId })
            .in('id', toAdd)
        if (addError) return { error: "Erro ao adicionar membros." }
    }

    // 3. Remove (Set their role_id to null or a default 'Visualizador' if exists? Let's treat as NULL or handle gracefully)
    // Actually, setting to NULL effectively removes permissions.
    if (toRemove.length > 0) {
        const { error: removeError } = await supabase
            .from('profiles')
            .update({ role_id: null }) // Or some default role?
            .in('id', toRemove)
        if (removeError) return { error: "Erro ao remover membros." }
    }

    revalidatePath('/dashboard/settings/roles')
    return { success: true }
}
