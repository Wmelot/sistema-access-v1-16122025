
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

async function openDB() {
    console.log('OPENING DATABASE TO ANON (Emergency Mode)...');
    const client = new Client(config);
    try {
        await client.connect();

        await client.query(`
            GRANT USAGE ON SCHEMA public TO anon;
            GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
            GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
            GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon;
        `);

        console.log('✅ DATABASE IS NOW OPEN TO ANON.');

    } catch (err) {
        console.error('❌ Error opening DB:', err.message);
    } finally {
        await client.end();
    }
}

openDB();
