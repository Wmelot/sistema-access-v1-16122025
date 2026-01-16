'use server';

import { createClient } from '@supabase/supabase-js';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// NOTE: We must use the SERVICE_ROLE_KEY to perform admin actions like creating users
// without email confirmation or managing other users' data.
// NEVER expose this client to the browser.
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function listAllUsers() {
    try {
        // 1. Get Current User and their Organization
        const sessionClient = await createSessionClient()
        const { data: { user: currentUser } } = await sessionClient.auth.getUser()

        if (!currentUser) return { success: false, error: "Não autenticado." }

        const { data: currentProfile } = await sessionClient
            .from('profiles')
            .select('organization_id')
            .eq('id', currentUser.id)
            .single()

        const currentOrgId = currentProfile?.organization_id

        if (!currentOrgId) return { success: false, error: "Organização não encontrada." }

        // 2. Fetch Profiles for this Organization ONLY, using Admin to ensure we get them all
        // (Use supabaseAdmin because profiles table might have RLS restricting viewing others)
        // Actually, RLS usually allows viewing profiles in same org, but Admin is safer for "Settings" page.
        const { data: profiles, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select(`
                id,
                full_name,
                role_id,
                organization_id,
                roles (
                    id,
                    name
                )
            `)
            .eq('organization_id', currentOrgId)

        if (profileError) {
            console.error('Error fetching profiles:', profileError);
            return { success: false, error: "Erro ao buscar perfis." }
        }

        const profileIds = profiles.map(p => p.id)

        // 3. Fetch Auth Users (DIRECT DB ACCESS) 
        // We bypass supabaseAdmin.auth.admin.listUsers() because API is 500ing
        const { listUsersDirect } = await import('@/lib/auth-bypass');
        const { users, error } = await listUsersDirect();

        if (error) throw new Error(error);

        // 4. Filter & Merge
        const enrichedUsers = users
            .filter(u => profileIds.includes(u.id))
            .map(user => {
                const profile = profiles.find(p => p.id === user.id);
                return {
                    ...user,
                    profile: profile || null,
                    roleName: (profile?.roles as any)?.name || 'Sem Perfil'
                };
            });

        // 5. Fetch Available Roles (Filtered by Org + Global/Null)
        const { data: availableRoles } = await supabaseAdmin
            .from('roles')
            .select('id, name, organization_id')
            .or(`organization_id.eq.${currentOrgId},organization_id.is.null`)
            .order('name');

        return { success: true, users: enrichedUsers, availableRoles: availableRoles || [] };
    } catch (error: any) {
        console.error('Error listing users:', error);
        return { success: false, error: error.message };
    }
}

export async function createUser(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const displayName = formData.get('displayName') as string;
    const roleId = formData.get('roleId') as string;

    if (!email || !password) {
        return { success: false, error: 'Email and Password are required' };
    }

    try {
        // 1. Create Auth User
        const { data: { user }, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto confirm
            user_metadata: {
                full_name: displayName || '',
            }
        });

        if (createError) throw createError;

        if (user) {
            // 2. Update Profile with Role and Name
            // Note: Trigger might create profile, but we safeguard update
            // Wait a moment for trigger or use upsert
            // Use supabaseAdmin to bypass RLS
            // We use upsert to be safe against race conditions with triggers
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .upsert({
                    id: user.id,
                    full_name: displayName,
                    role_id: roleId || null,
                    email: email
                });

            if (profileError) console.error('Error updating profile:', profileError);
        }

        revalidatePath('/dashboard/settings/users');
        return { success: true, message: 'User created successfully', user };
    } catch (error: any) {
        console.error('Error creating user:', error);
        return { success: false, error: error.message };
    }
}

export async function updateUserProfile(userId: string, data: { email?: string; fullName?: string }) {
    try {
        const updates: any = {};

        // 1. Update Auth Email if provided
        if (data.email) {
            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                email: data.email,
                email_confirm: true,
                user_metadata: { full_name: data.fullName } // Also update metadata
            });
            if (authError) throw authError;
            updates.email = data.email;
        } else if (data.fullName) {
            // If only name provided, update metadata
            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                user_metadata: { full_name: data.fullName }
            });
            if (authError) throw authError;
        }

        // 2. Update Public Profile
        if (data.fullName) updates.full_name = data.fullName;

        if (Object.keys(updates).length > 0) {
            // Use supabaseAdmin to bypass RLS
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update(updates)
                .eq('id', userId);

            if (profileError) console.error('Error updating profile:', profileError);
        }

        revalidatePath('/dashboard/settings/users');
        return { success: true, message: 'Dados atualizados com sucesso' };
    } catch (error: any) {
        console.error('Error updating profile:', error);
        return { success: false, error: error.message };
    }
}

export async function updateUserPassword(userId: string, newPassword: string) {
    try {
        // [BYPASS] Use Direct DB Update because Auth API is 500ing
        const { updatePasswordDirect } = await import('@/lib/auth-bypass');
        const { success, error } = await updatePasswordDirect(userId, newPassword);

        if (error) throw new Error(error);

        return { success: true, message: 'Password updated' };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateUserEmail(userId: string, newEmail: string) {
    try {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            email: newEmail,
            email_confirm: true // Auto confirm the new email
        });
        if (error) throw error;

        // Also update profile email for consistency
        await supabaseAdmin.from('profiles').update({ email: newEmail }).eq('id', userId);

        revalidatePath('/dashboard/settings/users');
        return { success: true, message: 'Email updated successfully' };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function assignUserRole(userId: string, roleId: string) {
    try {
        // Use supabaseAdmin to bypass RLS and Upsert to ensure profile exists
        const { error } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: userId,
                role_id: roleId === 'none' ? null : roleId
            });

        if (error) throw error;

        revalidatePath('/dashboard/settings/users');
        return { success: true, message: 'Role updated successfully' };
    } catch (error: any) {
        console.error('Error assigning role:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteUser(userId: string) {
    try {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (error) throw error;

        revalidatePath('/dashboard/settings/users');
        return { success: true, message: 'User deleted' };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
