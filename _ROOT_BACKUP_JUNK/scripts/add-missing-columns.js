
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

async function fixMissingColumns() {
    console.log('🔧 ADDING MISSING COLUMNS TO PATIENTS...');
    const client = new Client(config);
    try {
        await client.connect();

        // 1. ADD MISSING COLUMNS
        // Based on src/actions/patients.ts
        const queries = [
            "ALTER TABLE patients ADD COLUMN IF NOT EXISTS gender text;",
            "ALTER TABLE patients ADD COLUMN IF NOT EXISTS occupation text;",
            "ALTER TABLE patients ADD COLUMN IF NOT EXISTS marketing_source text;",
            "ALTER TABLE patients ADD COLUMN IF NOT EXISTS related_patient_id uuid REFERENCES patients(id);",
            "ALTER TABLE patients ADD COLUMN IF NOT EXISTS relationship_degree text;",
            "ALTER TABLE patients ADD COLUMN IF NOT EXISTS price_table_id uuid;", // REFERENCES price_tables(id) if exists
            // Invoice fields
            "ALTER TABLE patients ADD COLUMN IF NOT EXISTS invoice_cpf text;",
            "ALTER TABLE patients ADD COLUMN IF NOT EXISTS invoice_name text;",
            "ALTER TABLE patients ADD COLUMN IF NOT EXISTS invoice_address_zip text;",
            "ALTER TABLE patients ADD COLUMN IF NOT EXISTS invoice_address text;",
            "ALTER TABLE patients ADD COLUMN IF NOT EXISTS invoice_number text;",
            "ALTER TABLE patients ADD COLUMN IF NOT EXISTS invoice_neighborhood text;",
            "ALTER TABLE patients ADD COLUMN IF NOT EXISTS invoice_city text;",
            "ALTER TABLE patients ADD COLUMN IF NOT EXISTS invoice_state text;"
        ];

        for (const q of queries) {
            await client.query(q);
            console.log(`✅ Executed: ${q.split('ADD COLUMN')[1].split(';')[0].trim()}`);
        }

        // 2. CHECK PRICE TABLES
        // If price_tables exists, add FK
        const ptCheck = await client.query("SELECT to_regclass('public.price_tables')");
        if (ptCheck.rows[0].to_regclass) {
            try {
                await client.query("ALTER TABLE patients ADD CONSTRAINT fk_price_table FOREIGN KEY (price_table_id) REFERENCES price_tables(id);");
                console.log('✅ Added FK to price_tables');
            } catch (e) {
                // Ignore if constraint exists
                if (!e.message.includes('already exists')) console.log('Info:', e.message);
            }
        }

        // 3. RELOAD SCHEMA CACHE
        console.log('🔄 Reloading Supabase Schema Cache...');
        await client.query("NOTIFY pgrst, 'reload config';");

        console.log('✨ COLUMNS RESTORED SUCCESSFULLY ✨');

    } catch (err) {
        console.error('❌ ERROR:', err.message);
    } finally {
        await client.end();
    }
}

fixMissingColumns();
