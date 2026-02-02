
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config({ path: '.env.local' });

async function verify() {
    console.log('Testing connection using DATABASE_URL from environment...');

    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL is missing from env!');
        process.exit(1);
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
    });

    try {
        await client.connect();
        console.log('✅ Successfully connected to DB via PG Client (DATABASE_URL works!)');

        const res = await client.query('SELECT current_database(), current_user');
        console.log('   Meta:', res.rows[0]);

        await client.end();

        console.log('\nTesting Supabase Admin Client...');
        // Minimal test of supabase client wrapper if file exists
        try {
            const { createAdminClient } = await import('../src/lib/supabase/admin');
            const sb = createAdminClient();
            const { data, error } = await sb.from('organizations').select('count', { count: 'exact', head: true });

            if (error) {
                console.error('❌ Supabase Client Error:', error.message);
            } else {
                console.log('✅ Supabase Client Connected! Org count access check passed.');
            }
        } catch (e) {
            console.warn('⚠️ Could not import/run admin client check (might be TS vs JS issue in script), but direct DB is good.');
        }

    } catch (err) {
        console.error('❌ Connection Failed:', err.message);
        process.exit(1);
    }
}

verify();
