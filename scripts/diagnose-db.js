
const { Client } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function diagnose() {
    console.log('Connecting to DB...');
    const client = new Client({ connectionString });
    try {
        await client.connect();

        console.log('\n--- 1. Check User (auth.users) ---');
        const userRes = await client.query("SELECT id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data FROM auth.users WHERE email = 'wmelot@gmail.com'");
        if (userRes.rowCount === 0) {
            console.error('❌ User wmelot@gmail.com NOT FOUND in auth.users');
        } else {
            console.log('✅ User found:', userRes.rows[0]);
        }

        if (userRes.rowCount > 0) {
            const userId = userRes.rows[0].id;
            console.log('\n--- 2. Check Profile (public.profiles) ---');
            const profileRes = await client.query("SELECT * FROM public.profiles WHERE id = $1", [userId]);
            if (profileRes.rowCount === 0) {
                console.error('❌ Profile NOT FOUND for user ID:', userId);
            } else {
                console.log('✅ Profile found:', profileRes.rows[0]);
            }
        }

        console.log('\n--- 3. Check Organization (public.organizations) ---');
        const orgRes = await client.query("SELECT * FROM public.organizations WHERE slug = 'access-fisioterapia'");
        if (orgRes.rowCount === 0) {
            console.error('❌ Organization Access Fisioterapia NOT FOUND');
        } else {
            console.log('✅ Organization found:', orgRes.rows[0]);
        }

        console.log('\n--- 4. Check Triggers on auth.users ---');
        const triggersRes = await client.query(`
            SELECT event_object_table, trigger_name, event_manipulation, action_statement 
            FROM information_schema.triggers 
            WHERE event_object_schema = 'auth' AND event_object_table = 'users'
        `);
        if (triggersRes.rowCount > 0) {
            console.log('Triggers found:', triggersRes.rows.map(t => t.trigger_name).join(', '));
        } else {
            console.log('No triggers found on auth.users (This might be normal or good)');
        }

    } catch (err) {
        console.error('ERROR performing DB operations:', err);
    } finally {
        await client.end();
    }
}

diagnose();
