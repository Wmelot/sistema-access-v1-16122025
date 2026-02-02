import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function debugSchema() {
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    await client.connect();

    try {
        console.log("Checking columns in organizations...");
        const resOrg = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'organizations';
        `);
        const orgColumns = resOrg.rows.map(r => r.column_name);
        console.log("Organizations Columns:", orgColumns);

        const hasFeatures = orgColumns.includes('features');
        if (!hasFeatures) {
            console.log("CRITICAL: 'features' column missing in organizations! Adding it...");
            await client.query(`ALTER TABLE public.organizations ADD COLUMN features JSONB DEFAULT '{}'::jsonb;`);
        } else {
            console.log("'features' column exists.");
        }

        console.log("Checking trigger function...");
        const resTrigger = await client.query(`
            SELECT prosrc FROM pg_proc WHERE proname = 'sync_org_features_from_plan';
        `);
        if (resTrigger.rows.length > 0) {
            console.log("Trigger function source:", resTrigger.rows[0].prosrc);
        } else {
            console.log("Trigger function not found.");
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

debugSchema();
