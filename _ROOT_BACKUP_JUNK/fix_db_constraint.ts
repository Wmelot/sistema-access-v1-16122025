import { Pool } from 'pg';
const pool = new Pool({
    connectionString: 'postgresql://postgres:0xw8SnQc09fHn7S4@db.robptuukezhqvtasjyhz.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});
async function run() {
    try {
        console.log('🔧 Fixing DB Constraints...');
        await pool.query('ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_name_key');
        console.log('✅ Dropped global unique constraint on role name.');
        
        await pool.query('ALTER TABLE roles ADD CONSTRAINT roles_org_unique UNIQUE (organization_id, name)');
        console.log('✅ Added composite unique constraint (organization_id + name).');
    } catch(e) { console.error('Error:', e.message) } finally { await pool.end() }
}
run();
