const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const SUPABASE_URL = "https://robptuukezhqvtasjyhz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYnB0dXVrZXpocXZ0YXNqeWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ4NjcwMCwiZXhwIjoyMDgzMDYyNzAwfQ.hufdKEjY0XFSIYvrv7FrNyb2aX49JORBulplO19d0u4";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const base_path = "/Users/wmelo/Axiom/clinic30490_backup_excel/";

function loadSheet(file) {
    const wb = xlsx.readFile(path.join(base_path, file));
    return xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
}

function normalize(str) {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
}

async function migrate() {
    console.log("Iniciando migração de teste v3...");

    const { data: orgs } = await supabase.from('organizations').select('id').eq('slug', 'access-fisioterapia');
    if (!orgs || orgs.length === 0) return console.error("Org não encontrada");
    const orgId = orgs[0].id;

    const { data: qProfiles } = await supabase.from('profiles').select('id, full_name').eq('organization_id', orgId);
    const warleyId = qProfiles.find(p => normalize(p.full_name).includes("warley"))?.id || qProfiles[0].id;

    // Load Data
    const ptsData = loadSheet("pacientes.xlsx");
    const evolutionsData = loadSheet("_8.xlsx");
    const palmilhaData = loadSheet("form_tabela_12.xlsx");
    const agData = loadSheet("agendamentos.xlsx");

    const targetNames = ["Adaliana Bastos dos Santos Rodrigues", "Adriana Paula da Cruz Barreto"];

    // Process target patients
    for (const name of targetNames) {
        const normName = normalize(name);
        let p = ptsData.find(pt => normalize(pt.nome_paciente) === normName);
        if (!p) {
            console.log(`Paciente ${name} não encontrado no Excel. Tentando busca parcial...`);
            p = ptsData.find(pt => normalize(pt.nome_paciente).includes(normName.split(" ")[0]));
        }
        if (!p) continue;

        let { data: axiomPt } = await supabase.from('patients').select('id').eq('name', p.nome_paciente).maybeSingle();
        if (!axiomPt) {
            const { data: newPt } = await supabase.from('patients').insert({
                organization_id: orgId, name: p.nome_paciente,
                cpf: p.cpf ? String(p.cpf) : null,
                phone: p.celular ? String(p.celular) : null,
                birthdate: p.nascimento || null,
                gender: p.sexo === 'F' ? 'female' : 'male'
            }).select().single();
            axiomPt = newPt;
        }
        const patientId = axiomPt.id;
        console.log(`Paciente: ${p.nome_paciente} (ID Feegow: ${p.id}, ID Axiom: ${patientId})`);

        // 1. Evoluções de _8.xlsx
        const pEvolutions = evolutionsData.filter(e => String(e.paciente_id) === String(p.id));
        console.log(`- Migrando ${pEvolutions.length} evoluções`);
        for (const e of pEvolutions) {
            await supabase.from('patient_records').insert({
                organization_id: orgId, patient_id: patientId, professional_id: warleyId,
                content: { text: e.conteudo_resumo, _record_type: 'evolution' },
                created_at: e.data_hora, updated_at: e.data_hora
            });
        }

        // 2. Palmilhas
        const pPalmilhas = palmilhaData.filter(f => normalize(f.NomePaciente) === normName);
        console.log(`- Migrando ${pPalmilhas.length} formulários de palmilha`);
        for (const f of pPalmilhas) {
            try {
                const raw = JSON.parse(f.campo || "{}");
                await supabase.from('patient_records').insert({
                    organization_id: orgId, patient_id: patientId, professional_id: warleyId,
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

    const weekStart = "2026-01-19";
    const weekEnd = "2026-01-23";

    const filteredAg = agData.filter(a => a.Data >= weekStart && a.Data <= weekEnd);
    console.log(`Encontrados ${filteredAg.length} agendamentos no Feegow.`);

    for (const a of filteredAg) {
        const pInfo = ptsData.find(pt => String(pt.id) === String(a.paciente_id));
        if (!pInfo) continue;

        // Ensure patient exists
        let { data: axiomPt } = await supabase.from('patients').select('id').eq('name', pInfo.nome_paciente).maybeSingle();
        if (!axiomPt) {
            const { data: newPt } = await supabase.from('patients').insert({
                organization_id: orgId, name: pInfo.nome_paciente, phone: String(pInfo.celular || "")
            }).select().single();
            axiomPt = newPt;
        }

        const startTime = `${a.Data}T${a.Hora || "08:00:00"}`;
        const endTime = new Date(new Date(startTime).getTime() + (parseInt(a.tempo) || 60) * 60000).toISOString();

        await supabase.from('appointments').insert({
            organization_id: orgId,
            patient_id: axiomPt.id,
            professional_id: warleyId,
            status: statusMap[a.status_id] || 'scheduled',
            start_time: startTime,
            end_time: endTime,
            notes: a.Notas || `Importado: Feegow ID ${a.id}`
        });
    }

    console.log("Feito!");
}

migrate();
