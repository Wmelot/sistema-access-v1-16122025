const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const SUPABASE_URL = "https://robptuukezhqvtasjyhz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYnB0dXVrZXpocXZ0YXNqeWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ4NjcwMCwiZXhwIjoyMDgzMDYyNzAwfQ.hufdKEjY0XFSIYvrv7FrNyb2aX49JORBulplO19d0u4";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const base_path = "/Users/wmelo/Axiom/clinic30490_backup_excel/";

function loadSheet(file) {
    if (!fs.existsSync(path.join(base_path, file))) {
        console.warn(`Arquivo ${file} não encontrado.`);
        return [];
    }
    const wb = xlsx.readFile(path.join(base_path, file));
    return xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
}

function normalize(str) {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
}

const axiomProfMap = {
    "1": "839a77d3-a7f0-4103-bc4a-004ec550bd15", // Warley
    "2": "895dfdde-a6d6-4d29-97e8-626b9deb16b8", // Felipe
    "3": "64c95a02-04ce-4ace-b63f-b4210cf282a9", // Fábio
    "4": "5dd90d13-be69-4718-8cd8-cb1a9737a7b8"  // Rayane
};

async function migrate() {
    console.log("Iniciando migração de teste v4...");

    const { data: orgs } = await supabase.from('organizations').select('id').eq('slug', 'access-fisioterapia');
    if (!orgs || orgs.length === 0) return console.error("Org não encontrada");
    const orgId = orgs[0].id;

    const ptsData = loadSheet("pacientes.xlsx");
    const agData = loadSheet("agendamentos.xlsx");

    // Form Tables that usually contain "Summaries" of forms
    const evolutionSources = ["_8.xlsx", "_12.xlsx", "_13.xlsx"];
    const formsData = evolutionSources.map(src => ({ src, data: loadSheet(src) }));

    const palmilhaData = loadSheet("form_tabela_12.xlsx");

    const targetNames = ["Adaliana Bastos dos Santos Rodrigues", "Adriana Paula da Cruz Barreto"];

    // 1. Process target patients
    for (const name of targetNames) {
        const normName = normalize(name);
        const p = ptsData.find(pt => normalize(pt.nome_paciente) === normName);
        if (!p) {
            console.warn(`Paciente ${name} não encontrado no backup.`);
            continue;
        }

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
        console.log(`\nPaciente: ${p.nome_paciente} (Axiom ID: ${patientId})`);

        // Evolutions (Crawl all possible summary tables)
        for (const { src, data } of formsData) {
            const records = data.filter(e => String(e.paciente_id) === String(p.id));
            if (records.length > 0) {
                console.log(`- Migrando ${records.length} registros da tabela ${src} como evoluções`);
                for (const rec of records) {
                    const profId = axiomProfMap[String(rec.profissionail_id)] || axiomProfMap["1"];
                    const date = rec.data_hora || rec.dhup;

                    // Create card with the "Summary" content
                    await supabase.from('patient_records').insert({
                        organization_id: orgId,
                        patient_id: patientId,
                        professional_id: profId,
                        content: {
                            text: rec.conteudo_resumo,
                            _record_type: 'evolution',
                            _source_form: src
                        },
                        created_at: date,
                        updated_at: date
                    });
                }
            }
        }

        // Detailed "Palmilha" Assessment Form (Structured Data)
        const pPalmilhas = palmilhaData.filter(f => normalize(f.NomePaciente) === normName);
        console.log(`- Migrando ${pPalmilhas.length} formulários estruturados de palmilha`);
        for (const f of pPalmilhas) {
            try {
                const raw = JSON.parse(f.campo || "{}");
                await supabase.from('patient_records').insert({
                    organization_id: orgId, patient_id: patientId, professional_id: axiomProfMap["1"],
                    content: { biomechanics: raw, _record_type: 'assessment', _template_name: 'Consulta Palmilha (Feegow)' },
                    created_at: f.DataHora, updated_at: f.DataHora
                });
            } catch (err) { }
        }
    }

    // 2. Sync Agenda correctly with professional mapping
    console.log("\nSincronizando agenda Jan 19-23 com mapeamento de profissionais...");
    const statusMap = {
        1: 'scheduled', 2: 'attended', 3: 'attended', 4: 'scheduled',
        5: 'scheduled', 6: 'no_show', 7: 'scheduled', 11: 'cancelled',
        15: 'scheduled', 22: 'cancelled', 208: 'attended'
    };

    const weekStart = "2026-01-19";
    const weekEnd = "2026-01-23";

    const filteredAg = agData.filter(a => a.Data >= weekStart && a.Data <= weekEnd);
    console.log(`Encontrados ${filteredAg.length} agendamentos no Feegow.`);

    // Set to keep track of patients we already checked/created to avoid redundant queries
    const patientCache = {};

    for (const a of filteredAg) {
        const feegowPtId = String(a.paciente_id);
        let axiomPtId = patientCache[feegowPtId];

        if (!axiomPtId) {
            const pInfo = ptsData.find(pt => String(pt.id) === feegowPtId);
            if (!pInfo) continue;

            let { data: axiomPt } = await supabase.from('patients').select('id').eq('name', pInfo.nome_paciente).maybeSingle();
            if (!axiomPt) {
                const { data: newPt } = await supabase.from('patients').insert({
                    organization_id: orgId, name: pInfo.nome_paciente, phone: String(pInfo.celular || "")
                }).select().single();
                axiomPt = newPt;
            }
            axiomPtId = axiomPt.id;
            patientCache[feegowPtId] = axiomPtId;
        }

        const startTime = `${a.Data}T${a.Hora || "08:00:00"}`;
        const duration = parseInt(a.tempo) || 60;
        const endTime = new Date(new Date(startTime).getTime() + duration * 60000).toISOString();

        const professionalId = axiomProfMap[String(a.profissional_id)] || axiomProfMap["1"];

        await supabase.from('appointments').insert({
            organization_id: orgId,
            patient_id: axiomPtId,
            professional_id: professionalId,
            status: statusMap[a.status_id] || 'scheduled',
            start_time: startTime,
            end_time: endTime,
            notes: a.Notas || `Importado Feegow | ID: ${a.id}`
        });
    }

    console.log("Feito!");
}

migrate();
