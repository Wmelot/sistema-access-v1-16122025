import { Pool } from 'pg';
const pool = new Pool({
    connectionString: 'postgresql://postgres:0xw8SnQc09fHn7S4@db.robptuukezhqvtasjyhz.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});
async function run() {
    try {
        console.log('🔍 Checking orphan appointments...');
        // Buscar agendamentos sem org_id
        const res = await pool.query("SELECT id, patient_id, professional_id, start_time, organization_id FROM appointments WHERE organization_id IS NULL AND status != 'cancelled'");
        console.log('Orphan Appointments Found:', res.rows.length);
        if (res.rows.length > 0) {
            console.log('Samples:', res.rows.slice(0, 3));
            
            // Tentar descobrir a org do profissional para corrigir
            const profId = res.rows[0].professional_id;
            const profRes = await pool.query('SELECT organization_id FROM profiles WHERE id = ', [profId]);
            if (profRes.rows.length > 0) {
                 const orgId = profRes.rows[0].organization_id;
                 console.log('Found Org ID for professional:', orgId);
                 
                 // FIX AUTOMÁTICO
                 console.log('🚑 Fixing orphans...');
                 await pool.query('UPDATE appointments SET organization_id =  WHERE organization_id IS NULL AND professional_id = ', [orgId, profId]);
                 console.log('✅ Fixed!');
            }
        }
    } catch(e) { console.error(e) } finally { await pool.end() }
}
run();
