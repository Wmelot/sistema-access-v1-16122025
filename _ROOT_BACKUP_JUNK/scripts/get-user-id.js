
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

async function getId() {
    console.log('Fetching correct ID for wmelot@gmail.com...');
    const client = new Client(config);
    try {
        await client.connect();
        const res = await client.query("SELECT id FROM auth.users WHERE email = 'wmelot@gmail.com'");
        if (res.rows.length > 0) {
            console.log('User ID:', res.rows[0].id);
        } else {
            console.log('User NOT FOUND in auth.users!');
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

getId();
