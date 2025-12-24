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
    document_logo_url?: string;
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
            return null; // No rows, normal for new accounts
        }
        console.error('Error fetching settings:', JSON.stringify(error, null, 2));
        return null; // Fail gracefully instead of crashing the app
    }

    return data as ClinicSettings;
}

import { Pool } from 'pg';

// Use a connection pool for better performance in serverless/Node env
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
    // In production/Vercel, you might need SSL: { rejectUnauthorized: false }
});

export async function updateClinicSettings(formData: FormData) {
    // We use direct PG connection here to bypass PostgREST schema cache issues
    const client = await pool.connect();

    try {
        const name = formData.get('name') as string;
        const cnpj = formData.get('cnpj') as string;
        const email = formData.get('email') as string;
        const phone = formData.get('phone') as string;
        const website = formData.get('website') as string;
        const primary_color = formData.get('primary_color') as string;
        const logo_url = formData.get('logo_url') as string;
        const document_logo_url = formData.get('document_logo_url') as string;

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

        // Upsert logic using standard SQL
        // We use ON CONFLICT to handle both insert and update in one query if ID is 1 or just check existence
        // Since we don't know the ID easily without querying, let's just do a check-and-update approach simpler for this context

        const checkRes = await client.query('SELECT id FROM clinic_settings LIMIT 1');

        if (checkRes.rows.length > 0) {
            const id = checkRes.rows[0].id;
            await client.query(`
                UPDATE clinic_settings SET
                    name = $1,
                    cnpj = $2,
                    email = $3,
                    phone = $4,
                    website = $5,
                    primary_color = $6,
                    logo_url = $7,
                    document_logo_url = $8,
                    address = $9,
                    updated_at = NOW()
                WHERE id = $10
            `, [name, cnpj, email, phone, website, primary_color, logo_url, document_logo_url, address, id]);
        } else {
            await client.query(`
                INSERT INTO clinic_settings (
                    name, cnpj, email, phone, website, primary_color, logo_url, document_logo_url, address
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [name, cnpj, email, phone, website, primary_color, logo_url, document_logo_url, address]);
        }

        revalidatePath('/dashboard/settings');
        return { success: true, message: 'Configurações salvas com sucesso!' };

    } catch (error: any) {
        console.error('Error saving settings (Direct PG):', error);
        return { success: false, message: `Falha ao salvar: ${error.message || 'Erro desconhecido'}` };
    } finally {
        client.release();
    }
}
