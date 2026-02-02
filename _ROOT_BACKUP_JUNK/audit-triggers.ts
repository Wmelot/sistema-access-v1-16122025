import { db } from './src/lib/db';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function r() {
    try {
        const res = await db.query("SELECT trigger_name, action_statement FROM information_schema.triggers WHERE event_object_schema = 'auth' AND event_object_table = 'users'");
        console.log('Triggers:', JSON.stringify(res.rows, null, 2));
    } catch (e: any) {
        console.error('Error fetching triggers:', e.message);
    }
}
r();
