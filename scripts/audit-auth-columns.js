
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

async function auditColumns() {
    console.log('Auditing Auth Columns...');
    const client = new Client(config);
    try {
        await client.connect();

        const tables = ['users', 'sessions', 'refresh_tokens'];

        for (const table of tables) {
            console.log(`\n--- Columns in auth.${table} ---`);
            const res = await client.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_schema = 'auth' AND table_name = $1
                ORDER BY ordinal_position;
            `, [table]);

            if (res.rowCount === 0) {
                console.error(`❌ Table auth.${table} NOT FOUND or no columns visible!`);
            } else {
                console.log(res.rows.map(c => `${c.column_name} (${c.data_type})`).join(', '));
            }
        }

    } catch (err) {
        console.error('❌ Audit Error:', err.message);
    } finally {
        await client.end();
    }
}

auditColumns();
