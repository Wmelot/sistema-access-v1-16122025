
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

async function listExtensions() {
    console.log('Listing Extensions...');
    const client = new Client(config);
    try {
        await client.connect();

        const res = await client.query(`
            SELECT extname, extversion, extnamespace::regnamespace as schema
            FROM pg_extension
            ORDER BY extname;
        `);

        console.log('Extensions found:', res.rows.map(r => `${r.extname} (${r.extversion})`).join(', '));

        // Specifically check for pgcrypto, sodium, vault
        const critical = ['pgcrypto', 'pg_sodium', 'supabase_vault', 'uuid-ossp'];
        const installed = res.rows.map(r => r.extname);

        critical.forEach(ext => {
            if (installed.includes(ext)) {
                console.log(`✅ ${ext} is installed.`);
            } else {
                console.warn(`⚠️ ${ext} is MISSING!`);
            }
        });

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await client.end();
    }
}

listExtensions();
