const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://robptuukezhqvtasjyhz.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYnB0dXVrZXpocXZ0YXNqeWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ4NjcwMCwiZXhwIjoyMDgzMDYyNzAwfQ.hufdKEjY0XFSIYvrv7FrNyb2aX49JORBulplO19d0u4";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function dumpData() {
    console.log("=== INICIANDO DUMP DE DADOS SUPABASE (BYPASS RLS) ===");

    // 1. Perfis de Usuários (Profiles)
    console.log("\n--- TABELA: profiles ---");
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('id, full_name, email, role, organization_id');
    if (pErr) console.error("Erro profiles:", pErr);
    else console.table(profiles);

    // 2. Professores Acadêmicos
    console.log("\n--- TABELA: academic_professors ---");
    const { data: profs, error: prErr } = await supabase.from('academic_professors').select('*');
    if (prErr) console.error("Erro academic_professors:", prErr);
    else console.table(profs);

    // 3. Registros Acadêmicos (Evidências)
    console.log("\n--- TABELA: acad_registros ---");
    const { data: regs, error: rErr } = await supabase.from('acad_registros').select('*');
    if (rErr) console.error("Erro acad_registros:", rErr);
    else console.table(regs);

    // 4. Mídias Acadêmicas
    console.log("\n--- TABELA: acad_midias ---");
    const { data: midias, error: mErr } = await supabase.from('acad_midias').select('*');
    if (mErr) console.error("Erro acad_midias:", mErr);
    else console.table(midias);

    // 5. Evidências Antigas (Para checar migração)
    console.log("\n--- TABELA: academic_evidences (ANTIGA) ---");
    const { data: oldEvs, error: oErr } = await supabase.from('academic_evidences').select('*');
    if (oErr) console.error("Erro academic_evidences:", oErr);
    else console.table(oldEvs);
}

dumpData();
