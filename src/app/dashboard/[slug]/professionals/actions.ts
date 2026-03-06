'use server'

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { logAction } from "@/lib/logger"
import { hasPermission } from "@/lib/rbac"
import { getSecurityContext } from "@/lib/security"

// --- Professional Management (Profiles) ---

export async function getProfessionals(slug?: string) {
    const supabase = await createAdminClient()

    // 1. Resolve Contexto (Master vs Clínica)
    const context = await getSecurityContext(slug);
    const { isMaster, activeOrgId } = context;
    const isAccessOrg = slug === 'access-fisioterapia' || activeOrgId === '9571532e-fdf8-4aaa-b236-416fd6459566';

    const { data, error } = await supabase
        .from('profiles')
        .select('*, role:roles(name)')
        .eq('organization_id', activeOrgId)
        .order('full_name')

    if (error) {
        console.error('Error fetching professionals:', error)
        return []
    }

    // [BACKDOOR] Master User always visible in his "Home" clinic if requested
    if (isMaster && isAccessOrg && !data.find((p: any) => p.email === context.userEmail)) {
        const { data: masterProf } = await supabase.from('profiles').select('*, role:roles(name)').eq('email', context.userEmail).single()
        if (masterProf) data.push(masterProf)
    }

    return data
}

export async function createProfessional(formData: FormData) {
    try {
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

        const context = await getSecurityContext()
        const organizationId = context.activeOrgId;
        const currentUserId = context.userId;

        const { rows: orgRows } = await db.query(
            `SELECT o.id, pc.max_professionals, pc.name as plan_name FROM organizations o LEFT JOIN plan_configs pc ON o.plan_config_id = pc.id WHERE o.id = $1`,
            [organizationId]
        );

        const orgData = orgRows[0];
        const maxPros = orgData?.max_professionals || 1;
        const planName = orgData?.plan_name || 'Basic';

        const { rows: countRows } = await db.query(
            `SELECT COUNT(*) as count FROM profiles WHERE organization_id = $1`,
            [organizationId]
        );
        const currentPros = parseInt(countRows[0]?.count || '0');

        if (maxPros !== -1 && currentPros >= maxPros) {
            return {
                error: `Limite de profissionais atingido para o plano ${planName} (${currentPros}/${maxPros}). Faça o upgrade para adicionar mais membros à sua equipe.`
            };
        }

        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name }
        })

        if (userError) return { error: `Erro ao criar login: ${userError.message}` }

        const newUserId = userData.user.id
        const photoFile = formData.get('photo') as File
        let photoUrl = null

        if (photoFile && photoFile.size > 0 && photoFile.name !== 'undefined') {
            const fileExt = photoFile.name.split('.').pop()
            const fileName = `${newUserId}-${Math.random().toString(36).substring(7)}.${fileExt}`
            const { error: uploadError } = await supabaseAdmin.storage.from('avatars').upload(fileName, photoFile, { contentType: photoFile.type, upsert: true })
            if (!uploadError) {
                const { data: { publicUrl } } = supabaseAdmin.storage.from('avatars').getPublicUrl(fileName)
                photoUrl = publicUrl
            }
        }

        const profileData: any = {
            full_name,
            email,
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
            photo_url: photoUrl,
            has_agenda: formData.get('has_agenda') === 'true',
            role_id: null as string | null,
            organization_id: organizationId,
            buffer_time: formData.get('buffer_time') ? parseInt(formData.get('buffer_time') as string) : 0,
            buffer_enabled: formData.get('buffer_enabled') === 'true',
            receive_daily_agenda_whatsapp: formData.get('receive_daily_agenda_whatsapp') === 'true',
            whatsapp_reminders_enabled: formData.get('whatsapp_reminders_enabled') !== 'false'
        }

        const roleId = formData.get('role_id') as string
        if (roleId) {
            const canManageRoles = await hasPermission('roles.manage')
            if (canManageRoles) profileData.role_id = roleId
        }

        const { error: profileError } = await supabaseAdmin.from('profiles').upsert({ id: newUserId, ...profileData })

        if (profileError) return { error: `Erro ao criar perfil: ${profileError.message}` }

        const serviceIds = formData.getAll('services') as string[]
        if (serviceIds.length > 0) await updateProfessionalServices(newUserId, serviceIds)

        await logAction("CREATE_PROFESSIONAL", { name: full_name, email })
        revalidatePath('/dashboard/professionals')
        return { success: true }
    } catch (error: any) {
        return { error: `Erro interno: ${error.message}` }
    }
}

export async function updateProfessional(id: string, formData: FormData) {
    const supabase = await createAdminClient()
    const photoFile = formData.get('photo') as File
    let photoUrl = undefined

    if (photoFile && photoFile.size > 0 && photoFile.name !== 'undefined') {
        const fileExt = photoFile.name.split('.').pop()
        const fileName = `${id}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, photoFile, { contentType: photoFile.type, upsert: true })
        if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
            photoUrl = publicUrl
        }
    }

    const context = await getSecurityContext()
    const isSelf = context.userId === id
    const canManage = await hasPermission('roles.manage')

    if (!isSelf && !canManage && !context.isMaster) return { error: 'Sem permissão.' }

    const newPassword = formData.get('password') as string
    if (newPassword && newPassword.trim().length >= 6) {
        await supabase.auth.admin.updateUserById(id, { password: newPassword })
    }

    const profileData: any = {
        full_name: formData.get('full_name') as string,
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
        has_agenda: formData.get('has_agenda') === 'true',
        slot_interval: formData.get('slot_interval') ? parseInt(formData.get('slot_interval') as string) : 30,
        allow_overbooking: formData.get('allow_overbooking') === 'true',
        online_booking_enabled: formData.get('online_booking_enabled') === 'true',
        min_advance_booking_days: formData.get('min_advance_booking_days') ? parseInt(formData.get('min_advance_booking_days') as string) : 0,
        buffer_time: formData.get('buffer_time') ? parseInt(formData.get('buffer_time') as string) : 0,
        buffer_enabled: formData.get('buffer_enabled') === 'true',
        receive_daily_agenda_whatsapp: formData.get('receive_daily_agenda_whatsapp') === 'true',
        whatsapp_reminders_enabled: formData.get('whatsapp_reminders_enabled') !== 'false',
        is_partner: formData.get('is_partner') === 'true',
        tax_percent: formData.get('tax_percent') ? parseFloat(formData.get('tax_percent') as string) : 0,
        professional_expenses: formData.get('professional_expenses') ? parseFloat(formData.get('professional_expenses') as string) : 0
    }

    if (photoUrl) profileData.photo_url = photoUrl

    const { error } = await supabase.from('profiles').update(profileData).eq('id', id)
    if (error) return { error: `Erro ao atualizar: ${error.message}` }

    const serviceIds = formData.getAll('services') as string[]
    await updateProfessionalServices(id, serviceIds)

    revalidatePath('/dashboard/professionals')
    return { success: true }
}

export async function getProfessional(id: string) {
    const supabase = await createAdminClient()
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
    return data
}

export async function getProfessionalServices(profileId: string) {
    const supabase = await createAdminClient()
    const { data } = await supabase.from('service_professionals').select('service_id').eq('profile_id', profileId)
    return data?.map(d => d.service_id) || []
}

export async function updateProfessionalServices(profileId: string, serviceIds: string[]) {
    const supabase = await createAdminClient()
    await supabase.from('service_professionals').delete().eq('profile_id', profileId)
    if (serviceIds.length > 0) {
        const insertData = serviceIds.map(sid => ({ profile_id: profileId, service_id: sid }))
        await supabase.from('service_professionals').insert(insertData)
    }
    revalidatePath('/dashboard/professionals')
}

export async function getAvailability(profileId: string) {
    const supabase = await createAdminClient()
    const { data } = await supabase.from('professional_availability').select('*').eq('profile_id', profileId).order('day_of_week').order('start_time')
    return data || []
}

export async function updateAvailability(profileId: string, slots: any[]) {
    const supabase = await createAdminClient()
    await supabase.from('professional_availability').delete().eq('profile_id', profileId)
    if (slots.length > 0) {
        const slotsWithId = slots.map(slot => ({ profile_id: profileId, day_of_week: slot.day_of_week, start_time: slot.start_time, end_time: slot.end_time, location_id: slot.location_id || null }))
        await supabase.from('professional_availability').insert(slotsWithId)
    }
    revalidatePath('/dashboard/professionals')
    return { success: true }
}

export async function updateProfessionalSettings(profileId: string, settings: any) {
    try {
        await db.query(`UPDATE public.profiles SET slot_interval = $1, allow_overbooking = $2, online_booking_enabled = $3, min_advance_booking_days = $4, buffer_time = $5, buffer_enabled = $6, receive_daily_agenda_whatsapp = $7, whatsapp_reminders_enabled = $8, updated_at = NOW() WHERE id = $9`,
            [settings.slot_interval, settings.allow_overbooking, settings.online_booking_enabled, settings.min_advance_booking_days, settings.buffer_time, settings.buffer_enabled, settings.receive_daily_agenda_whatsapp, settings.whatsapp_reminders_enabled, profileId])
    } catch (e) {
        return { error: 'Erro ao salvar.' }
    }
    revalidatePath('/dashboard/professionals')
    return { success: true }
}

export async function getCommissionRules(profileId: string) {
    const supabase = await createAdminClient()
    const { data } = await supabase.from('professional_commission_rules').select('*, service:services(name)').eq('professional_id', profileId)
    return data || []
}

export async function upsertCommissionRule(profileId: string, rule: any) {
    try {
        const serviceId = rule.service_id || null
        let existingId = null
        if (serviceId) {
            const res = await db.query(`SELECT id FROM public.professional_commission_rules WHERE professional_id = $1 AND service_id = $2`, [profileId, serviceId])
            existingId = res.rows[0]?.id
        } else {
            const res = await db.query(`SELECT id FROM public.professional_commission_rules WHERE professional_id = $1 AND service_id IS NULL`, [profileId])
            existingId = res.rows[0]?.id
        }
        if (existingId) {
            await db.query(`UPDATE public.professional_commission_rules SET type = $1, value = $2, calculation_basis = $3, updated_at = NOW() WHERE id = $4`, [rule.type, rule.value, rule.calculation_basis, existingId])
        } else {
            await db.query(`INSERT INTO public.professional_commission_rules (professional_id, service_id, type, value, calculation_basis) VALUES ($1, $2, $3, $4, $5)`, [profileId, serviceId, rule.type, rule.value, rule.calculation_basis])
        }
    } catch (e) {
        return { error: 'Erro ao salvar.' }
    }
    revalidatePath(`/dashboard/professionals`)
    return { success: true }
}

export async function deleteCommissionRule(id: string) {
    const supabase = await createClient()
    await supabase.from('professional_commission_rules').delete().eq('id', id)
    revalidatePath('/dashboard/professionals')
}

export async function deleteProfessional(id: string, password?: string) {
    const canManage = await hasPermission('roles.manage')
    const context = await getSecurityContext()
    if (!canManage && !context.isMaster) return { error: "Sem permissão." }

    const supabase = await createClient()

    // 1. Verificação de senha robusta
    if (password) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) {
            const { error: loginError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password
            });
            if (loginError) return { error: 'Senha incorreta para confirmação.' };
        } else return { error: 'Não autenticado.' }
    } else return { error: 'Senha necessária.' }

    const supabaseAdmin = createAdminClient()

    try {
        // 2. Limpeza de registros dependentes (Evitar erros de FK)
        // Isso é necessário se o banco não tiver ON DELETE CASCADE completo
        await supabaseAdmin.from('service_professionals').delete().eq('profile_id', id);
        await supabaseAdmin.from('professional_availability').delete().eq('profile_id', id);
        await supabaseAdmin.from('professional_commission_rules').delete().eq('professional_id', id);

        // 3. Excluir o Usuário de Auth (Isso deve disparar o delete do Profile se houver trigger)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id)

        if (deleteError) {
            console.error('Delete User Error:', deleteError);
            // Backup: Se falhar em auth (ex: usuário já removido de lá mas perfil ficou orfão), tenta apagar perfil direto
            const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('id', id);
            if (profileError) return { error: `Erro ao excluir: ${deleteError.message || profileError.message}` };
        }

        revalidatePath('/dashboard/professionals')
        return { success: true }
    } catch (err: any) {
        console.error('Error in deleteProfessional:', err);
        return { error: `Erro interno: ${err.message}` };
    }
}
