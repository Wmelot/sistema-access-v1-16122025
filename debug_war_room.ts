import { Pool } from 'pg';
const pool = new Pool({
    connectionString: 'postgresql://postgres:0xw8SnQc09fHn7S4@db.robptuukezhqvtasjyhz.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});
async function run() {
    try {
        console.log('🔥 DIAGNOSTICO DE GUERRA 🔥');
        
        // 1. Pegar usuario pelo email (Warley)
        const userRes = await pool.query("SELECT id, email, organization_id FROM profiles WHERE email ILIKE '%teste%' OR email ILIKE '%warley%' LIMIT 5");
        console.log('
👥 Usuários encontrados:', userRes.rows);

        // Vou pegar o primeiro ID que parece ser o seu (Warley ou TesteFinal)
        // Na imagem o profissional é 'Warley de Melo Oliveira'
        const warley = await pool.query("SELECT id, full_name, organization_id FROM profiles WHERE full_name ILIKE '%Warley de Melo Oliveira%' LIMIT 1");
        if (warley.rows.length === 0) { console.log('❌ Warley não encontrado no banco!'); return; }
        
        const warleyId = warley.rows[0].id;
        const warleyOrg = warley.rows[0].organization_id;
        console.log(`
🎯 Alvo: Warley (ID: ${warleyId}, Org: ${warleyOrg})`);

        // 2. Buscar TODOS agendamentos desse profissional
        const allAppts = await pool.query(
            "SELECT id, start_time, end_time, organization_id, status FROM appointments WHERE professional_id = ", 
            [warleyId]
        );
        console.log(`
📅 Agendamentos Totais para Warley: ${allAppts.rows.length}`);
        console.table(allAppts.rows.map(r => ({
            timestamp: r.start_time.toISOString(),
            org_match: r.organization_id === warleyOrg ? '✅' : '❌ ' + r.organization_id,
            status: r.status
        })));

    } catch(e) { console.error('CRASH:', e) } finally { await pool.end() }
}
run();
