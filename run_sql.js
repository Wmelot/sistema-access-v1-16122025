const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

// Supabase local default info or from env
// Try to grab the direct connection string if possible (port 54322 usually)
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function run() {
    console.log('Connecting to DB...');
    const client = new Client({ connectionString });
    try {
        await client.connect();

        // 1. Verify Column Existence in Information Schema
        console.log('Verifying table columns...');
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'clinic_settings';
        `);
        console.log('Columns found:', res.rows.map(r => r.column_name).join(', '));

        const hasColumn = res.rows.some(r => r.column_name === 'document_logo_url');
        if (!hasColumn) {
            console.error('CRITICAL: document_logo_url STILL MISSING! Attempting to add again...');
            await client.query(`
                ALTER TABLE public.clinic_settings 
                ADD COLUMN IF NOT EXISTS document_logo_url text;
            `);
        } else {
            console.log('CONFIRMED: document_logo_url exists in database.');
        }

        // 2. Explicit Grants (Fix visibility issues)
        console.log('Granting explicit permissions...');
        await client.query(`
            GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
            GRANT ALL ON public.clinic_settings TO anon, authenticated, service_role;
        `);

        // 3. Force Schema Cache Reload (Try multiple methods)
        console.log('Reloading PostgREST schema cache...');
        await client.query("NOTIFY pgrst, 'reload schema'");

        // This is a hacky way to ensure cache invalidation in some setups
        await client.query(`
            COMMENT ON TABLE public.clinic_settings IS 'Settings for the clinic';
            COMMENT ON TABLE public.clinic_settings IS NULL;
        `);

        console.log('SUCCESS: Verification & Grants complete.');

    } catch (err) {
        console.error('ERROR performing DB operations:', err);
    } finally {
        await client.end();
    }
}

run();
