'use server';

import { createClient } from '@supabase/supabase-js';
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
        // 1. Fetch Auth Users
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error) throw error;

        // 2. Fetch Profiles (to get role_id and names)
        // Use supabaseAdmin to bypass RLS
        const { data: profiles, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select(`
                id,
                full_name,
                role_id,
                roles (
                    id,
                    name
                )
            `);

        if (profileError) console.error('Error fetching profiles:', profileError);

        // 3. Merge Data
        const enrichedUsers = users.map(user => {
            const profile = profiles?.find(p => p.id === user.id);
            return {
                ...user,
                profile: profile || null,
                roleName: (profile?.roles as any)?.name || 'Sem Perfil'
            };
        });

        // 4. Fetch Available Roles for the UI dropdown
        const { data: availableRoles } = await supabaseAdmin
            .from('roles')
            .select('id, name')
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
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: newPassword
        });
        if (error) throw error;

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
