import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// We need the postgres connection string, not the supabase url
const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

async function upgrade() {
    if (!dbUrl) {
        console.error("No database URL found");
        return;
    }
    const client = new Client({ connectionString: dbUrl });
    try {
        await client.connect();
        await client.query(`
            ALTER TABLE academic_evidences 
            ADD COLUMN IF NOT EXISTS backed_up_at TIMESTAMP WITH TIME ZONE;
        `);
        console.log("Migration successful: added backed_up_at to academic_evidences");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await client.end();
    }
}
upgrade();
