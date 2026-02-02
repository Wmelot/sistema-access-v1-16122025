
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function addColumns() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    try {
        console.log('Adding buffer_time column...');
        await client.query(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS buffer_time INTEGER DEFAULT 0;`);

        console.log('Adding buffer_enabled column...');
        await client.query(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS buffer_enabled BOOLEAN DEFAULT false;`);

        console.log('Adding receive_daily_agenda_whatsapp column...');
        await client.query(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS receive_daily_agenda_whatsapp BOOLEAN DEFAULT false;`);

        console.log('Adding whatsapp_reminders_enabled column (24h)...');
        await client.query(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_reminders_enabled BOOLEAN DEFAULT true;`);

        console.log('Columns added successfully.');
    } catch (err) {
        console.error('Error adding columns:', err);
    } finally {
        await client.end();
    }
}

addColumns();
