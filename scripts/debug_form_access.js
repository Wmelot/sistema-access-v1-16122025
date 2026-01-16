
const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function debugForm(id) {
    try {
        await client.connect();
        const res = await client.query('SELECT id, title, deleted_at, is_active FROM form_templates WHERE id = $1', [id]);
        console.log(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

// User didn't give ID, but I can pick one from the screenshots if readable, or just list a few.
// 'WOMAC (Osteoartrite)' is visible in screenshot.
// Let's find its ID first.
