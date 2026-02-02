
const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
});

async function check() {
    try {
        await client.connect();

        const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

        console.log("Existing tables:", res.rows.map(r => r.table_name));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

check();
