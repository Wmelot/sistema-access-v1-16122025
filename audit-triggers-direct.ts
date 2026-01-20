import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function r() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        const res = await client.query("SELECT trigger_name, action_statement FROM information_schema.triggers WHERE event_object_schema = 'auth' AND event_object_table = 'users'");
        console.log('Triggers:', JSON.stringify(res.rows, null, 2));
        await client.end();
    } catch (e: any) {
        console.error('Connection Error:', e.message);
    }
}
r();
