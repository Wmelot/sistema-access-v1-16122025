
const { Client } = require('pg');

const config = {
    user: 'postgres',
    password: 'WMFM@26222425',
    host: 'db.robptuukezhqvtasjyhz.supabase.co',
    port: 5432,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
};

async function fixFinal() {
    console.log('Applying FINAL Fixes and Manual Insert Test...');
    const client = new Client(config);
    try {
        await client.connect();

        // 1. Skip pg_sodium (Not available in this instance)
        // console.log('Enabling pg_sodium...');
        // await client.query('CREATE EXTENSION IF NOT EXISTS pg_sodium SCHEMA pgsodium CASCADE;');
        console.log('Skipping pg_sodium (unavailable).');

        // 2. Aggressive Grants
        console.log('Granting Aggressive Permissions...');
        await client.query(`
            GRANT USAGE ON SCHEMA auth TO postgres, service_role, anon, authenticated, dashboard_user, supabase_admin;
            GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, service_role, dashboard_user, supabase_admin;
            GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, service_role, dashboard_user, supabase_admin;
            GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO postgres, service_role, dashboard_user, supabase_admin;
            
            -- Ensure public is open
            GRANT USAGE ON SCHEMA public TO postgres, service_role, anon, authenticated, dashboard_user, supabase_admin;
            GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role, dashboard_user, supabase_admin;
        `);

        // 3. Test Raw SQL Insert into auth.users (Does this trigger error?)
        console.log('Testing Raw SQL Insert into auth.users...');
        const testEmail = `raw_insert_${Date.now()}@example.com`;
        const res = await client.query(`
            INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
            VALUES (
                '00000000-0000-0000-0000-000000000000',
                gen_random_uuid(),
                'authenticated',
                'authenticated',
                $1,
                crypt('password123', gen_salt('bf')),
                now(),
                now(),
                now(),
                '{"provider":"email","providers":["email"]}',
                '{}',
                now(),
                now(),
                '',
                '',
                '',
                ''
            )
            RETURNING id;
        `, [testEmail]);

        console.log('✅ RAW SQL Insert SUCCEEDED! User ID:', res.rows[0].id);

    } catch (err) {
        console.error('❌ RAW SQL Insert or Fix FAILED:', err.message);
        console.error('   Hint: If SQL insert fails, the table constraints or triggers (even hidden ones) are the blocker.');
    } finally {
        await client.end();
    }
}

fixFinal();
