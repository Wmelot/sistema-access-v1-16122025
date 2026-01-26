
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function createWaitlistTable() {
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

    const pool = new Pool({
        connectionString,
        ssl: connectionString.includes('127.0.0.1') ? false : { rejectUnauthorized: false }
    });

    try {
        console.log('Creating waitlist table...');
        await pool.query(`
      CREATE TABLE IF NOT EXISTS public.waitlist (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
        patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
        professional_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        preferred_date DATE NOT NULL,
        preferred_time_start TIME,
        preferred_time_end TIME,
        notes TEXT,
        status TEXT DEFAULT 'pending', -- pending, notified, scheduled, cancelled
        notified_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

        console.log('Waitlist table created successfully.');
    } catch (err) {
        console.error('Error creating waitlist table:', err);
    } finally {
        await pool.end();
    }
}

createWaitlistTable();
