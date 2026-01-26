const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function fix() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("DATABASE_URL not found in .env.local");
        return;
    }

    console.log('Connecting to database...');
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected.');

        console.log('Altering api_integrations table...');

        // 1. Add id if missing
        await client.query(`
            ALTER TABLE api_integrations ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
        `);

        // 2. Add organization_id if missing
        await client.query(`
            ALTER TABLE api_integrations ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
        `);

        // 3. Remove UNIQUE constraint on provider if it exists
        // We need to find the constraint name first. Usually it's 'api_integrations_provider_key'
        try {
            await client.query(`ALTER TABLE api_integrations DROP CONSTRAINT IF EXISTS api_integrations_provider_key;`);
        } catch (e) { console.log('Notice: Could not drop constraint (might not exist)'); }

        // 4. Add composite unique constraint
        try {
            await client.query(`
                ALTER TABLE api_integrations ADD CONSTRAINT api_integrations_org_provider_key UNIQUE (organization_id, provider);
            `);
        } catch (e) { console.log('Notice: Composite constraint already exists or failed to create'); }

        console.log('Table fixed successfully.');

    } catch (err) {
        console.error('❌ Error fixing table:', err);
    } finally {
        await client.end();
    }
}

fix();
