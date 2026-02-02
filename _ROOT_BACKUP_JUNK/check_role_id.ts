import { Pool } from 'pg';
const pool = new Pool({
    connectionString: 'postgresql://postgres:0xw8SnQc09fHn7S4@db.robptuukezhqvtasjyhz.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});
async function run() {
    try {
        const res = await pool.query("SELECT role_id, role, organization_id FROM profiles WHERE email = 'Testefinal@teste.com'");
        console.log('Profile:', res.rows[0]);
        
        if (res.rows[0]?.role_id) {
             const role = await pool.query('SELECT * FROM roles WHERE id = ', [res.rows[0].role_id]);
             console.log('Role Table Entry:', role.rows[0]);
        } else {
             console.log('ROLE_ID IS NULL!');
        }
    } catch(e) { console.error(e) } finally { await pool.end() }
}
run();
