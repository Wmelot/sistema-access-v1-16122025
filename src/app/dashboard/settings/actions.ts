'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type ClinicSettings = {
    id: string;
    name: string;
    cnpj?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: {
        street: string;
        number: string;
        complement?: string;
        neighborhood: string;
        city: string;
        state: string;
        zip: string;
    };
    logo_url?: string;
    primary_color?: string;
};

export async function getClinicSettings() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('clinic_settings')
        .select('*')
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // No rows found, return null or default
            return null;
        }
        console.error('Error fetching settings:', error);
        throw new Error('Failed to fetch settings');
    }

    return data as ClinicSettings;
}

export async function updateClinicSettings(formData: FormData) {
    const supabase = await createClient();

    const name = formData.get('name') as string;
    const cnpj = formData.get('cnpj') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const website = formData.get('website') as string;
    const primary_color = formData.get('primary_color') as string;
    const logo_url = formData.get('logo_url') as string;

    // Address handling
    const address = {
        street: formData.get('address.street'),
        number: formData.get('address.number'),
        complement: formData.get('address.complement'),
        neighborhood: formData.get('address.neighborhood'),
        city: formData.get('address.city'),
        state: formData.get('address.state'),
        zip: formData.get('address.zip'),
    };

    // Check if a row exists
    const existing = await getClinicSettings();

    let error;
    if (existing) {
        const { error: updateError } = await supabase
            .from('clinic_settings')
            .update({
                name,
                cnpj,
                email,
                phone,
                website,
                primary_color,
                logo_url,
                address,
                updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
        error = updateError;
    } else {
        const { error: insertError } = await supabase
            .from('clinic_settings')
            .insert({
                name,
                cnpj,
                email,
                phone,
                website,
                primary_color,
                logo_url,
                address,
            });
        error = insertError;
    }

    if (error) {
        console.error('Error saving settings:', error);
        return { success: false, message: 'Falha ao salvar configurações.' };
    }

    revalidatePath('/dashboard/settings');
    return { success: true, message: 'Configurações salvas com sucesso!' };
}
