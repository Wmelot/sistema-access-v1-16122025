
const { Client } = require('pg');

const config = {
    user: 'postgres',
    password: 'WMFM@26222425',
    host: 'db.robptuukezhqvtasjyhz.supabase.co',
    port: 5432, // Try 5432 first, fallback to 54322 doesn't always work for direct, but usually 54322 is pooler, 6543 direct... 
    // The env said 54322. Let's try 54322 as per env but with proper auth object.
    port: 5432,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
};

// Override with env provided values if I can just trust the components
// Actually, looking at the URL: postgres://postgres:WMFM@26222425@db.robptuukezhqvtasjyhz.supabase.co:54322/postgres
// Host: db.robptuukezhqvtasjyhz.supabase.co
// Port: 54322
// User: postgres
// Pass: WMFM@26222425

const fixedConfig = {
    user: 'postgres',
    password: 'WMFM@26222425',
    host: 'db.robptuukezhqvtasjyhz.supabase.co',
    port: 5432, // Try direct port for diagnostic
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000 // 10s timeout
};

async function diagnose() {
    console.log('Connecting to DB with fixed string...');
    const client = new Client(fixedConfig);
    try {
        await client.connect();

        console.log('\n--- 1. Check User (auth.users) ---');
        // Need to be careful scanning auth.users, might not have permission if not 'postgres' superuser or service role
        // But we are using 'postgres' login so should be fine.
        const userRes = await client.query("SELECT id, email, confirmed_at, raw_app_meta_data, raw_user_meta_data FROM auth.users WHERE email = 'wmelot@gmail.com'");
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
            console.log('No triggers found on auth.users');
        }

    } catch (err) {
        console.error('ERROR performing DB operations:', err);
    } finally {
        await client.end();
    }
}

diagnose();
