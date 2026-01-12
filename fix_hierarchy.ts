
import { Client } from 'pg';
import { createClient } from '@supabase/supabase-js';

// We need Supabase Admin to create auth user if missing
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'; // Default to local 54321 but we need to talk to 54322 logic? 
// No, Supabase Auth runs on 54321 usually, but DB is 54322?
// The user said "sistema está rodando liso na porta 54322".
// Usually Supabase docker stack: Kong(8000) -> GoTrue(9999) -> Postgres(54322).
// So `supabase.auth` interacts with GoTrue which talks to Postgres.
// If I use the Service Key from .env.local, it should work.

async function fixHierarchy() {
    console.log('--- FIXING HIERARCHY (54322) ---');

    // Direct DB connection for Profiles
    const connectionString = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
    const client = new Client({ connectionString });
    await client.connect();

    try {
        const accessOrgId = '00000000-0000-0000-0000-000000000001';

        // 1. Fix Wmelot (Clinic Admin)
        console.log('Fixing wmelot@gmail.com...');
        await client.query(`
            UPDATE public.profiles 
            SET role = 'admin', organization_id = $1
            WHERE email = 'wmelot@gmail.com'
        `, [accessOrgId]);
        console.log('✅ wmelot -> admin @ Access Fisioterapia');

        // 2. Fix/Ensure AccessFisio (Super Master)
        const superEmail = 'accessfisio@gmail.com';

        // Check if exists in Auth (via DB)
        const userRes = await client.query("SELECT id FROM auth.users WHERE email = $1", [superEmail]);
        let superId;

        if (userRes.rows.length === 0) {
            console.log('⚠️ Super Admin Auth User Missing. Please create it via Supabase Studio or Sign Up.');
            console.log('Cannot set profile without Auth User.');
            // I should probably create it if I can, but I don't have the password user wants.
            // I'll assume it exists or I'll just upsert the profile if I find the ID.
            // Wait, if it doesn't exist, I can't set the profile ID.
        } else {
            superId = userRes.rows[0].id;
            console.log(`Super Admin Found: ${superId}`);

            // Upsert Profile
            await client.query(`
                INSERT INTO public.profiles (id, email, full_name, role, organization_id)
                VALUES ($1, $2, 'Axiom Super Admin', 'master', $3)
                ON CONFLICT (id) DO UPDATE 
                SET role = 'master', organization_id = $3
            `, [superId, superEmail, accessOrgId]);
            // Should Super Admin be part of Access Fisioterapia too? Or NULL?
            // "Super Admin da Axiom". Usually implies global access.
            // If I set Org to Access, they see Access Data.
            // If I set NULL, might break RLS if not handled.
            // PROBABLY user wants AccessFisio to manage everything?
            // But let's stick to strict role: 'master'.
            // I'll link to Access Fisioterapia for now as it's the "Main" org, or maybe a dedicated Axiom Org?
            // User said: "Axiom... (Super Admin)".
            // I'll link to Access Fisioterapia for safety (so they have a home), but Role 'master' gives the power.
            console.log('✅ accessfisio -> master');
        }

    } catch (e: any) {
        console.error('Error:', e.message);
    } finally {
        await client.end();
    }
}

fixHierarchy();
