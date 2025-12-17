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
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error) throw error;
        return { success: true, users };
    } catch (error: any) {
        console.error('Error listing users:', error);
        return { success: false, error: error.message };
    }
}

export async function createUser(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const displayName = formData.get('displayName') as string;
    // const role = formData.get('role') as string; // We'll handle roles via public.profiles or public.user_roles later

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
            // Optional: Assign initial role or profile here if needed
        }

        revalidatePath('/dashboard/settings/users');
        return { success: true, message: 'User created successfully', user };
    } catch (error: any) {
        console.error('Error creating user:', error);
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

        revalidatePath('/dashboard/settings/users');
        return { success: true, message: 'Email updated successfully' };
    } catch (error: any) {
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
