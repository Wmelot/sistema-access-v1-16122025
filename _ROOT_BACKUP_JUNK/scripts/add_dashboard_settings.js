
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

let connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL || '';

if (connectionString.includes('localhost')) {
    connectionString = connectionString.replace('localhost', '127.0.0.1');
}

const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('127.0.0.1') ? false : { rejectUnauthorized: false }
});

async function run() {
    const client = await pool.connect();
    try {
        console.log('Checking for dashboard_settings column in profiles...');
        const checkRes = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'dashboard_settings';
        `);

        if (checkRes.rows.length === 0) {
            console.log('Adding dashboard_settings column to profiles...');
            await client.query(`
                ALTER TABLE public.profiles 
                ADD COLUMN dashboard_settings JSONB DEFAULT '{}'::JSONB;
            `);
            console.log('Column added successfully.');
        } else {
            console.log('Column already exists.');
        }
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
