
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

async function inspectDDL() {
    console.log('Inspecting auth.users DDL...');
    const client = new Client(config);
    try {
        await client.connect();

        // Check defaults and generated columns
        const res = await client.query(`
            SELECT column_name, column_default, is_generated, generation_expression
            FROM information_schema.columns
            WHERE table_schema = 'auth' AND table_name = 'users';
        `);

        console.log('--- Columns with Defaults/Generation ---');
        res.rows.forEach(r => {
            if (r.column_default || (r.is_generated === 'ALWAYS')) {
                console.log(`${r.column_name}: default=[${r.column_default}] gen=[${r.generation_expression}]`);
            }
        });

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await client.end();
    }
}

inspectDDL();
