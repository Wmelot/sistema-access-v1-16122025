import { Pool } from 'pg';
const pool = new Pool({
    connectionString: 'postgresql://postgres:0xw8SnQc09fHn7S4@db.robptuukezhqvtasjyhz.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});
async function run() {
    try {
        const res = await pool.query('SELECT email, role, organization_id, created_at FROM profiles ORDER BY created_at DESC LIMIT 5');
        console.log(res.rows);
    } catch(e) { console.error(e) } finally { await pool.end() }
}
run();
