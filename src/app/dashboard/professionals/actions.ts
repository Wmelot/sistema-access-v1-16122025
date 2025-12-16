'use server'

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { logAction } from "@/lib/logger"
import { hasPermission } from "@/lib/rbac"

// --- Professional Management (Profiles) ---

export async function getProfessionals() {
    const supabase = await createClient()

    // In a real app we might filter by role='professional' or 'admin'
    // For now, assuming all profiles are clearable professionals
    const { data, error } = await supabase
        .from('profiles')
        .select('*, role:roles(name)')
        .order('full_name')

    if (error) {
        console.error('Error fetching professionals:', error)
        return []
    }
    return data
}

export async function createProfessional(formData: FormData) {
    // Requires Service Role for creating User
    let supabaseAdmin
    try {
        supabaseAdmin = createAdminClient()
    } catch (e) {
        console.error(e)
        return { error: 'Sem permissão de administrador (Service Key ausente).' }
    }

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const full_name = formData.get('full_name') as string
    const cpf = formData.get('cpf') as string
    // ... extract other fields

    // 1. Create Auth User
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name }
    })

    if (userError) {
        console.error('Error creating auth user:', userError)
        return { error: `Erro ao criar login: ${userError.message}` }
    }

    const userId = userData.user.id

    // 2. Update Profile (Row is created by trigger usually, but we update explicit fields)
    // Wait... if trigger creates profile, we update it. If not, we insert.
    // Usually Supabase starter has a trigger. Let's assume we Update using Admin to bypass RLS if needed, or just normal update?
    // The profile might not exist immediately if the trigger is slow, OR we use Admin to Insert/Upsert profile.

    // ... inside createProfessional ...

    // Photo Upload Logic
    const photoFile = formData.get('photo') as File
    let photoUrl = null

    if (photoFile && photoFile.size > 0 && photoFile.name !== 'undefined') {
        const fileExt = photoFile.name.split('.').pop()
        const fileName = `${userId}-${Math.random().toString(36).substring(7)}.${fileExt}`

        // Use standard client for storage (no need for admin usually if policy allows authenticated insert)
        // But here we are in a server action, might as well use Admin or standard client.
        // Standard client `supabase` (from createClient) has cookies and user context.
        // Wait, `createProfessional` runs as Admin to create user, but storage upload might need specific context.
        // Actually, easiest is to use `supabaseAdmin` for storage too to bypass policies or ensure it works.

        const { error: uploadError } = await supabaseAdmin.storage
            .from('avatars')
            .upload(fileName, photoFile, {
                contentType: photoFile.type,
                upsert: true
            })

        if (!uploadError) {
            const { data: { publicUrl } } = supabaseAdmin.storage
                .from('avatars')
                .getPublicUrl(fileName)
            photoUrl = publicUrl
        } else {
            console.error('Upload Error:', uploadError)
        }
    }

    const profileData = {
        full_name,
        email, // Auto-sync from Auth email
        cpf,
        birthdate: formData.get('birthdate') || null,
        gender: formData.get('gender'),
        phone: formData.get('phone'),
        council_type: formData.get('council_type'),
        council_number: formData.get('council_number'),
        specialty: formData.get('specialty'),
        color: formData.get('color'),
        bio: formData.get('bio'),
        address_zip: formData.get('address_zip'),
        address_street: formData.get('address_street'),
        address_number: formData.get('address_number'),
        address_complement: formData.get('address_complement'),
        address_neighborhood: formData.get('address_neighborhood'),
        address_city: formData.get('address_city'),
        address_state: formData.get('address_state'),
        photo_url: photoUrl, // Add photo URL
        role_id: null as string | null
    }

    // Role Assignment Logic
    const roleId = formData.get('role_id') as string
    if (roleId) {
        const canManageRoles = await hasPermission('roles.manage')
        if (canManageRoles) {
            profileData.role_id = roleId
        } else {
            console.warn("User tried to set role_id without permission")
        }
    } else {
        // Default role? Managed by DB default or handle here if needed.
        // Currently DB default is usually null or handled by migration mapping.
    }

    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
            id: userId,
            ...profileData
        })

    if (profileError) {
        console.error('Error upserting profile:', profileError)
        return { error: `Erro ao salvar perfil: ${profileError.message}` }
    }

    // Link Services
    const serviceIds = formData.getAll('services') as string[]
    if (serviceIds.length > 0) {
        await updateProfessionalServices(userId, serviceIds)
    }

    await logAction("CREATE_PROFESSIONAL", { name: full_name, email })
    revalidatePath('/dashboard/professionals')
    return { success: true }
}

// ... inside updateProfessional ...

export async function updateProfessional(id: string, formData: FormData) {
    // Need Admin client if we want to bypass RLS policies or strictly control updates
    // But `getProfessionals` used standard client. `update` typically requires being the user OR admin.
    // If I am editing "Another Professional", I must be Admin. standard `createClient` uses the logged-in user's role.
    // If logged-in user is Admin, RLS allows.
    const supabase = await createClient()

    // Handle Photo Upload
    const photoFile = formData.get('photo') as File
    let photoUrl = undefined

    if (photoFile && photoFile.size > 0 && photoFile.name !== 'undefined') {
        const fileExt = photoFile.name.split('.').pop()
        const fileName = `${id}-${Math.random().toString(36).substring(7)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, photoFile, {
                contentType: photoFile.type,
                upsert: true
            })

        if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName)
            photoUrl = publicUrl
        }
    }

    const profileData: any = {
        full_name: formData.get('full_name') as string,
        email: formData.get('email_profile'),
        cpf: formData.get('cpf'),
        phone: formData.get('phone'),
        birthdate: formData.get('birthdate') || null,
        gender: formData.get('gender'),
        council_type: formData.get('council_type'),
        council_number: formData.get('council_number'),
        specialty: formData.get('specialty'),
        color: formData.get('color'),
        bio: formData.get('bio'),
        address_zip: formData.get('address_zip'),
        address_street: formData.get('address_street'),
        address_number: formData.get('address_number'),
        address_complement: formData.get('address_complement'),
        address_neighborhood: formData.get('address_neighborhood'),
        address_city: formData.get('address_city'),
        address_state: formData.get('address_state'),
    }

    // Role Update Logic
    const roleId = formData.get('role_id') as string
    if (roleId) {
        const canManageRoles = await hasPermission('roles.manage')
        if (canManageRoles) {
            profileData.role_id = roleId
        }
    }

    if (photoUrl) {
        profileData.photo_url = photoUrl
    }

    const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', id)

    if (error) {
        console.error('Update Profile Error:', error)
        return { error: 'Erro ao atualizar perfil.' }
    }

    // Link Services
    const serviceIds = formData.getAll('services') as string[]
    await updateProfessionalServices(id, serviceIds)

    revalidatePath('/dashboard/professionals')
    return { success: true }
}

export async function getProfessional(id: string) {
    const supabase = await createClient()
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
    return data
}

// --- Service Linking ---

export async function getProfessionalServices(profileId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('service_professionals')
        .select('service_id')
        .eq('profile_id', profileId)

    return data?.map(d => d.service_id) || []
}

export async function updateProfessionalServices(profileId: string, serviceIds: string[]) {
    const supabase = await createAdminClient()

    // Delete all existing
    await supabase.from('service_professionals').delete().eq('profile_id', profileId)

    if (serviceIds.length > 0) {
        const insertData = serviceIds.map(sid => ({
            profile_id: profileId,
            service_id: sid
        }))
        await supabase.from('service_professionals').insert(insertData)
    }

    revalidatePath('/dashboard/professionals')
}

// --- Availability Management ---

export async function getAvailability(profileId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('professional_availability')
        .select('*')
        .eq('profile_id', profileId)
        .order('day_of_week')
        .order('start_time')

    return data || []
}

export async function updateAvailability(profileId: string, slots: any[]) {
    const supabase = await createAdminClient()

    // 1. Delete existing
    const { error: deleteError } = await supabase
        .from('professional_availability')
        .delete()
        .eq('profile_id', profileId)

    if (deleteError) {
        return { error: 'Erro ao limpar horários antigos.' }
    }

    // 2. Insert new
    if (slots.length > 0) {
        const slotsWithId = slots.map(slot => ({
            profile_id: profileId,
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time,
            location_id: slot.location_id || null // Handle location_id
        }))

        const { error: insertError } = await supabase
            .from('professional_availability')
            .insert(slotsWithId)

        if (insertError) {
            console.error(insertError)
            return { error: `Erro ao salvar: ${insertError.message}` }
        }
    }

    revalidatePath('/dashboard/professionals')
    return { success: true }
}

export async function updateProfessionalSettings(profileId: string, settings: { slot_interval: number; allow_overbooking: boolean; online_booking_enabled?: boolean; min_advance_booking_days?: number }) {
    const supabase = await createAdminClient()

    const { error } = await supabase
        .from('profiles')
        .update(settings)
        .eq('id', profileId)

    if (error) {
        console.error('Error updating settings:', error)
        return { error: 'Erro ao salvar configurações.' }
    }

    revalidatePath('/dashboard/professionals')
    return { success: true }
}

// --- Commission Rules ---

export async function getCommissionRules(profileId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('professional_commission_rules')
        .select(`
            *,
            service:services(name)
        `)
        .eq('professional_id', profileId)

    if (error) {
        console.error('Error fetching commission rules:', error)
        return []
    }
    return data
}

export async function upsertCommissionRule(profileId: string, rule: { service_id?: string | null, type: 'percentage' | 'fixed', value: number, calculation_basis: 'gross' | 'net' }) {
    const supabase = await createClient()

    // Manual Check-then-Write to avoid Constraint Error
    let query = supabase.from('professional_commission_rules')
        .select('id')
        .eq('professional_id', profileId)

    if (rule.service_id) {
        query = query.eq('service_id', rule.service_id)
    } else {
        query = query.is('service_id', null)
    }

    const { data: existing } = await query.single()

    const payload = {
        professional_id: profileId,
        service_id: rule.service_id || null,
        type: rule.type,
        value: rule.value,
        calculation_basis: rule.calculation_basis
    }

    let error
    if (existing) {
        const res = await supabase.from('professional_commission_rules').update(payload).eq('id', existing.id)
        error = res.error
    } else {
        const res = await supabase.from('professional_commission_rules').insert(payload)
        error = res.error
    }

    if (error) {
        console.error('Error saving rule:', error)
        return { error: `Erro DB: ${error.message}` }
    }

    revalidatePath(`/dashboard/professionals`)
    return { success: true }
}

export async function deleteCommissionRule(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('professional_commission_rules')
        .delete()
        .eq('id', id)

    if (error) {
        return { error: 'Erro ao excluir regra.' }
    }
    revalidatePath('/dashboard/professionals')
}

export async function deleteProfessional(id: string, password?: string) {
    const canManage = await hasPermission('roles.manage') // Or system.critical_action
    if (!canManage) return { error: "Sem permissão." }

    const supabase = await createClient()

    // 1. Verify Password
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

    // 2. Delete User (Requires Admin)
    let supabaseAdmin
    try {
        supabaseAdmin = createAdminClient()
    } catch (e) {
        return { error: 'Erro de configuração do servidor.' }
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(id)

    if (error) {
        console.error("Error deleting professional:", error)
        return { error: 'Erro ao excluir profissional. Verifique se existem vínculos.' }
    }

    await logAction("DELETE_PROFESSIONAL", { id })
    revalidatePath('/dashboard/professionals')
    return { success: true }
}
