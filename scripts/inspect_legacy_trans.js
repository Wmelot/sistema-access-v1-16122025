
const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Accessfisio%402022@db.djhipxldlkvkcrmudinv.supabase.co:5432/postgres';

async function listLegacyTransCols() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    try {
        await client.connect();
        const res = await client.query("SELECT * FROM transactions LIMIT 1");
        console.log("Legacy Transaction Sample:", res.rows[0]);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

listLegacyTransCols();
