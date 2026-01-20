import { Pool } from 'pg';
const pool = new Pool({
    connectionString: 'postgresql://postgres:0xw8SnQc09fHn7S4@db.robptuukezhqvtasjyhz.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});
async function run() {
    try {
        console.log('🚑 Fixing orphan appointments...');
        
        // 1. Get orphans
        const res = await pool.query("SELECT id, professional_id, start_time FROM appointments WHERE organization_id IS NULL");
        
        for (const appt of res.rows) {
             // 2. Find Organization of the Professional
             const profRes = await pool.query('SELECT organization_id FROM profiles WHERE id = ', [appt.professional_id]);
             if (profRes.rows.length > 0) {
                 const orgId = profRes.rows[0].organization_id;
                 if (orgId) {
                      await pool.query('UPDATE appointments SET organization_id =  WHERE id = ', [orgId, appt.id]);
                      console.log(`✅ Linked appointment ${appt.id} to Org ${orgId}`);
                 }
             }
        }
        console.log('Done.');
    } catch(e) { console.error(e) } finally { await pool.end() }
}
run();
