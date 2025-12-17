'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createReminder(content: string, dueDate?: Date, recipientId?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('User not authenticated');
    }

    const targetUserId = recipientId || user.id;

    const { error } = await supabase.from('reminders').insert({
        user_id: targetUserId,
        creator_id: user.id,
        content,
        due_date: dueDate ? dueDate.toISOString() : null,
        is_read: false
    });

    if (error) {
        console.error('Error creating reminder:', error);
        throw new Error('Failed to create reminder');
    }

    revalidatePath('/dashboard');
    return { success: true };
}

export async function getReminders() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching reminders:', error);
        return [];
    }

    return data;
}

export async function markReminderAsRead(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('reminders')
        .update({ status: 'read', is_read: true })
        .eq('id', id);

    if (error) {
        console.error('Error updating reminder:', error);
        throw new Error('Failed to update reminder');
    }

    revalidatePath('/dashboard');
}

export async function updateReminderStatus(id: string, status: 'pending' | 'read' | 'resolved' | 'snoozed') {
    const supabase = await createClient();

    const updates: any = { status };
    if (status === 'read') updates.is_read = true;
    if (status === 'pending') updates.is_read = false;

    const { error } = await supabase
        .from('reminders')
        .update(updates)
        .eq('id', id);

    if (error) {
        throw new Error('Failed to update status');
    }
    revalidatePath('/dashboard');
}

export async function snoozeReminder(id: string, minutes: number) {
    const supabase = await createClient();

    const newDate = new Date();
    newDate.setMinutes(newDate.getMinutes() + minutes);

    const { error } = await supabase
        .from('reminders')
        .update({
            due_date: newDate.toISOString(),
            status: 'snoozed',
            is_read: false
        })
        .eq('id', id);

    if (error) {
        throw new Error('Failed to snooze');
    }
    revalidatePath('/dashboard');
}

export async function deleteReminder(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting reminder:', error);
        throw new Error('Failed to delete reminder');
    }

    revalidatePath('/dashboard');
}
