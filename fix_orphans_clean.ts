
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: 'postgresql://postgres:0xw8SnQc09fHn7S4@db.robptuukezhqvtasjyhz.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log('🔍 Finding appointments with NULL organization_id...');
        const res = await pool.query("SELECT id, professional_id FROM appointments WHERE organization_id IS NULL");
        console.log(`Found ${res.rows.length} orphans.`);

        for (const appt of res.rows) {
            const profRes = await pool.query("SELECT organization_id FROM profiles WHERE id = $1", [appt.professional_id]);

            if (profRes.rows.length > 0) {
                const orgId = profRes.rows[0].organization_id;
                if (orgId) {
                    await pool.query("UPDATE appointments SET organization_id = $1 WHERE id = $2", [orgId, appt.id]);
                    console.log(`✅ Fixed Appt ${appt.id} -> Org ${orgId}`);
                } else {
                    console.log(`⚠️ Professional ${appt.professional_id} has no Org ID!`);
                }
            } else {
                console.log(`❌ Professional ${appt.professional_id} not found in profiles.`);
            }
        }
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await pool.end();
    }
}

run();
