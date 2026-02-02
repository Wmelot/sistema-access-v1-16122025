
const { Client } = require('pg');

const config = {
    user: 'postgres',
    password: 'WMFM@26222425',
    host: 'db.robptuukezhqvtasjyhz.supabase.co',
    port: 5432,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
};

async function listRoles() {
    console.log('Listing Roles...');
    const client = new Client(config);
    try {
        await client.connect();

        const res = await client.query('SELECT rolname FROM pg_roles');
        console.log('Roles found:', res.rows.map(r => r.rolname).join(', '));

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await client.end();
    }
}

listRoles();
