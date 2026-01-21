import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });
    await client.connect();
    const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'api_integrations'");
    console.log("api_integrations:", res.rows.map(r => r.column_name));

    const res2 = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'message_templates'");
    console.log("message_templates:", res2.rows.map(r => r.column_name));

    await client.end();
}
run();
