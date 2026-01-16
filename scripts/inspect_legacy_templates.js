
const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Accessfisio%402022@db.djhipxldlkvkcrmudinv.supabase.co:5432/postgres';

async function listTemplates() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    try {
        await client.connect();
        const res = await client.query("SELECT id, name, type FROM message_templates");
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

listTemplates();
