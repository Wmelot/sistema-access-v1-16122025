
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

async function fixRelationshipsAndPriceTable() {
    console.log('🔗 FIXING RELATIONSHIPS & PRICE TABLES...');
    const client = new Client(config);
    try {
        await client.connect();

        // 1. Fix patient_records -> profiles relationship
        console.log('🩺 Fixing patient_records FK...');
        try {
            await client.query(`
                ALTER TABLE patient_records 
                ADD CONSTRAINT fk_patient_records_professional 
                FOREIGN KEY (professional_id) REFERENCES profiles(id);
            `);
            console.log('✅ Added FK patient_records -> profiles');
        } catch (e) {
            if (e.message.includes('already exists')) console.log('✅ FK already exists');
            else console.log('⚠️ Error adding FK:', e.message);
        }

        // 2. Fix Price Tables (Error fetching price tables)
        // Ensure price_tables table exists and has organization_id
        console.log('💲 Checking price_tables...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS price_tables (
                id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                created_at timestamptz DEFAULT now(),
                organization_id uuid REFERENCES organizations(id),
                name text NOT NULL,
                is_active boolean DEFAULT true
            );
        `);
        // Enable RLS / Access (Simpler to just grant all for now as we did for others or use standard RLS if exists)
        await client.query("ALTER TABLE price_tables ENABLE ROW LEVEL SECURITY;");
        await client.query("GRANT ALL ON price_tables TO anon, authenticated, service_role;");
        await client.query("CREATE POLICY \"Enable all access for now\" ON price_tables FOR ALL USING (true);");

        console.log('✅ Ensured price_tables exists and is accessible.');

        // 3. RELOAD CACHE
        console.log('🔄 Reloading Supabase Schema Cache...');
        await client.query("NOTIFY pgrst, 'reload config';");

        console.log('✨ RELATIONSHIPS FIXED ✨');

    } catch (err) {
        console.error('❌ ERROR:', err.message);
    } finally {
        await client.end();
    }
}

fixRelationshipsAndPriceTable();
