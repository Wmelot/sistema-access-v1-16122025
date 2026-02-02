import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function reloadSchemaCache() {
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    await client.connect();

    try {
        console.log("Notifying PostgREST to reload schema cache...");
        await client.query("NOTIFY pgrst, 'reload config'");
        console.log("Notification sent.");
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

reloadSchemaCache();
