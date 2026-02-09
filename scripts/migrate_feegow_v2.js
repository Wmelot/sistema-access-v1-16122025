const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const SUPABASE_URL = "https://robptuukezhqvtasjyhz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYnB0dXVrZXpocXZ0YXNqeWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ4NjcwMCwiZXhwIjoyMDgzMDYyNzAwfQ.hufdKEjY0XFSIYvrv7FrNyb2aX49JORBulplO19d0u4";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const base_path = "/Users/wmelo/Axiom/clinic30490_backup_excel/";

async function migrate() {
    console.log("Iniciando migração de teste v2...");

    const { data: orgs } = await supabase.from('organizations').select('id').eq('slug', 'access-fisioterapia');
    if (!orgs || orgs.length === 0) return console.error("Org não encontrada");
    const orgId = orgs[0].id;

    const { data: profiles } = await supabase.from('profiles').select('id, full_name').eq('organization_id', orgId);
    const profMap = {};
    profiles.forEach(p => profMap[p.full_name.toLowerCase()] = p.id);
    const defaultProfId = profiles.find(p => p.full_name.includes("Warley"))?.id || profiles[0].id;

    // Load Data
    const ptsData = xlsx.utils.sheet_to_json(xlsx.readFile(path.join(base_path, "pacientes.xlsx")).Sheets["Planilha1"]);
    const evolutionsData = xlsx.utils.sheet_to_json(xlsx.readFile(path.join(base_path, "_8.xlsx")).Sheets["Planilha1"]);
    const palmilhaData = xlsx.utils.sheet_to_json(xlsx.readFile(path.join(base_path, "form_tabela_12.xlsx")).Sheets["Planilha1"]);
    const agData = xlsx.utils.sheet_to_json(xlsx.readFile(path.join(base_path, "agendamentos.xlsx")).Sheets["Planilha1"]);

    const targetNames = ["Adaliana Bastos dos Santos Rodrigues", "Adriana Paula da Cruz Barreto"];

    // Process target patients
    for (const name of targetNames) {
        let p = ptsData.find(pt => pt.nome_paciente === name);
        if (!p) { console.log(`Paciente ${name} não encontrado no Excel.`); continue; }

        let { data: axiomPt } = await supabase.from('patients').select('id').eq('name', name).maybeSingle();
        if (!axiomPt) {
            const { data: newPt } = await supabase.from('patients').insert({
                organization_id: orgId,
                name: name,
                cpf: p.cpf ? String(p.cpf) : null,
                phone: p.celular ? String(p.celular) : null,
                email: p.email || null,
                birthdate: p.nascimento || null,
                gender: p.sexo === 'F' ? 'female' : 'male'
            }).select().single();
            axiomPt = newPt;
        }
        const patientId = axiomPt.id;
        console.log(`Paciente: ${name} (ID Axiom: ${patientId})`);

        // 1. Evoluções de _8.xlsx
        const pEvolutions = evolutionsData.filter(e => e.paciente_id === p.id);
        console.log(`- Migrando ${pEvolutions.length} evoluções de _8.xlsx`);
        for (const e of pEvolutions) {
            await supabase.from('patient_records').insert({
                organization_id: orgId, patient_id: patientId, professional_id: defaultProfId,
                content: { text: e.conteudo_resumo, _record_type: 'evolution' },
                created_at: e.data_hora, updated_at: e.data_hora
            });
        }

        // 2. Formulários de palmilha de form_tabela_12.xlsx
        const pPalmilhas = palmilhaData.filter(f => f.NomePaciente === name);
        console.log(`- Migrando ${pPalmilhas.length} formulários de palmilha`);
        for (const f of pPalmilhas) {
            try {
                const raw = JSON.parse(f.campo || "{}");
                await supabase.from('patient_records').insert({
                    organization_id: orgId, patient_id: patientId, professional_id: defaultProfId,
                    content: { biomechanics: raw, _record_type: 'assessment', _template_name: 'Consulta Palmilha (Feegow)' },
                    created_at: f.DataHora, updated_at: f.DataHora
                });
            } catch (err) { }
        }
    }

    // 3. Agenda Jan 19-23
    console.log("\nSincronizando agenda Jan 19-23...");
    const statusMap = {
        1: 'scheduled', 2: 'attended', 3: 'attended', 4: 'scheduled',
        5: 'scheduled', 6: 'no_show', 7: 'scheduled', 11: 'cancelled',
        15: 'scheduled', 22: 'cancelled', 208: 'attended'
    };

    // Feegow dates in backup might be strings "YYYY-MM-DD"
    const weekStart = "2026-01-19";
    const weekEnd = "2026-01-23";

    const weekAg = agData.filter(a => a.Data >= weekStart && a.Data <= weekEnd);
    console.log(`Encontrados ${weekAg.length} agendamentos no Feegow para esta semana.`);

    for (const a of weekAg) {
        // Find patient
        const pInfo = ptsData.find(pt => pt.id === a.paciente_id);
        if (!pInfo) continue;

        let { data: axiomPt } = await supabase.from('patients').select('id').eq('name', pInfo.nome_paciente).maybeSingle();
        if (!axiomPt) {
            const { data: newPt } = await supabase.from('patients').insert({
                organization_id: orgId, name: pInfo.nome_paciente, phone: pInfo.celular ? String(pInfo.celular) : null
            }).select().single();
            axiomPt = newPt;
        }

        const startTime = `${a.Data}T${a.Hora || "08:00:00"}`;
        const endTime = new Date(new Date(startTime).getTime() + (a.tempo || 60) * 60000).toISOString();

        await supabase.from('appointments').insert({
            organization_id: orgId,
            patient_id: axiomPt.id,
            professional_id: defaultProfId, // Logic for professional mapping could be improved but using default for now
            status: statusMap[a.status_id] || 'scheduled',
            start_time: startTime,
            end_time: endTime,
            notes: a.Notas || `Importado: Feegow ID ${a.id}`
        });
    }

    console.log("Feito!");
}

migrate();
