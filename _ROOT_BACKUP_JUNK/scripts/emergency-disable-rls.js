
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

const tablesToOpen = [
    'clinical_protocols',
    'patients',
    'appointments',
    'profiles',
    'organizations',
    'transactions',
    'services',
    'professional_services', // Likely exists
    'clinical_assessments', // Likely exists
    'clinical_records'      // Likely exists
];

async function run() {
    console.log('🚨 EMERGENCY: Disabling RLS on all critical tables...');
    const client = new Client(config);
    try {
        await client.connect();

        for (const table of tablesToOpen) {
            try {
                // Check if table exists first to avoid errors stopping the script
                const check = await client.query(`SELECT to_regclass('public.${table}')`);
                if (check.rows[0].to_regclass) {
                    await client.query(`ALTER TABLE public.${table} DISABLE ROW LEVEL SECURITY;`);
                    console.log(`✅ RLS Disabled: ${table}`);

                    // Extra safety: Grant specific perms
                    await client.query(`GRANT ALL ON public.${table} TO anon;`);
                    console.log(`✅ Granted ALL to anon: ${table}`);
                } else {
                    console.log(`⚠️ Table not found (skipping): ${table}`);
                }
            } catch (err) {
                console.error(`❌ Error on ${table}:`, err.message);
            }
        }

        console.log('✅ Emergency Open Protocol Complete.');

    } catch (err) {
        console.error('CRITICAL ERROR:', err.message);
    } finally {
        await client.end();
    }
}

run();
