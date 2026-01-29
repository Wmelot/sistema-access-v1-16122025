const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const res = await pool.query(`
            SELECT 
                t.trigger_name, 
                p.prosrc as function_body
            FROM information_schema.triggers t
            JOIN pg_trigger pt ON t.trigger_name = pt.tgname
            JOIN pg_proc p ON pt.tgfoid = p.oid
            WHERE t.event_object_table = 'users' 
            AND t.event_object_schema = 'auth'
        `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
        process.exit(0);
    }
}
run();
