
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function addColumns() {
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

    const pool = new Pool({
        connectionString,
        ssl: connectionString.includes('127.0.0.1') ? false : { rejectUnauthorized: false }
    });

    try {
        console.log('Adding buffer_time column...');
        await pool.query(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS buffer_time INTEGER DEFAULT 0;`);

        console.log('Adding buffer_enabled column...');
        await pool.query(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS buffer_enabled BOOLEAN DEFAULT false;`);

        console.log('Adding receive_daily_agenda_whatsapp column...');
        await pool.query(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS receive_daily_agenda_whatsapp BOOLEAN DEFAULT false;`);

        console.log('Adding whatsapp_reminders_enabled column (24h)...');
        await pool.query(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_reminders_enabled BOOLEAN DEFAULT true;`);

        console.log('Columns added successfully.');
    } catch (err) {
        console.error('Error adding columns:', err);
    } finally {
        await pool.end();
    }
}

addColumns();
