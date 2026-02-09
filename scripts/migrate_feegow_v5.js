const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const SUPABASE_URL = "https://robptuukezhqvtasjyhz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYnB0dXVrZXpocXZ0YXNqeWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ4NjcwMCwiZXhwIjoyMDgzMDYyNzAwfQ.hufdKEjY0XFSIYvrv7FrNyb2aX49JORBulplO19d0u4";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const base_path = "/Users/wmelo/Axiom/clinic30490_backup_excel/";

function loadSheet(file) {
    if (!fs.existsSync(path.join(base_path, file))) return [];
    const wb = xlsx.readFile(path.join(base_path, file));
    return xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { raw: false });
}

function normalize(str) {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
}

// Fixed UUIDs for the Access Fisioterapia Organization
const ORG_ID = "9571532e-fdf8-4aaa-b236-416fd6459566";
const SLUG = "access-fisioterapia";

const AXIOM_PROF_MAP = {
    "1": "839a77d3-a7f0-4103-bc4a-004ec550bd15", // Warley de Melo Oliveira
    "2": "895dfdde-a6d6-4d29-97e8-626b9deb16b8", // Felipe França Perdigão
    "3": "64c95a02-04ce-4ace-b63f-b4210cf282a9", // Fábio de Oliveira Cardoso
    "4": "5dd90d13-be69-4718-8cd8-cb1a9737a7b8"  // Rayane Vilela Pereira
};

async function migrate() {
    console.log("Iniciando migração v5 (Correções Timezone, Status e Profissionais)...");

    // 1. CLEANUP PREVIOUS MIGRATIONS
    console.log("Limpando dados de migrações anteriores...");
    await supabase.from('appointments').delete().eq('organization_id', ORG_ID).ilike('notes', '%Importado Feegow%');
    await supabase.from('patient_records').delete().eq('organization_id', ORG_ID).or('content->>_source_form.is.not.null,content->>_template_name.eq.Consulta Palmilha (Feegow)');

    // 2. LOAD DATA
    const ptsData = loadSheet("pacientes.xlsx");
    const agData = loadSheet("agendamentos.xlsx");
    const evolutionSources = ["_8.xlsx", "_12.xlsx", "_13.xlsx"];
    const formsData = evolutionSources.map(src => ({ src, data: loadSheet(src) }));
    const f12Structured = loadSheet("form_tabela_12.xlsx");

    const targetNames = ["Adaliana Bastos dos Santos Rodrigues", "Adriana Paula da Cruz Barreto"];

    // 3. PROCESS TEST PATIENTS (FULL HISTORY)
    for (const name of targetNames) {
        const p = ptsData.find(pt => normalize(pt.nome_paciente) === normalize(name));
        if (!p) continue;

        let { data: axiomPt } = await supabase.from('patients').select('id').eq('name', p.nome_paciente).maybeSingle();
        if (!axiomPt) {
            const { data: newPt } = await supabase.from('patients').insert({
                organization_id: ORG_ID, name: p.nome_paciente,
                cpf: p.cpf ? String(p.cpf) : null,
                phone: p.celular ? String(p.celular) : null,
                birthdate: p.nascimento || null,
                gender: p.sexo === 'F' ? 'female' : 'male'
            }).select().single();
            axiomPt = newPt;
        }
        const patientId = axiomPt.id;
        console.log(`\nPaciente: ${p.nome_paciente} (Axiom: ${patientId}, Feegow: ${p.id})`);

        // Evolutions (Anamnese/Evolution cards)
        for (const { src, data } of formsData) {
            const records = data.filter(e => String(e.paciente_id) === String(p.id));
            if (records.length > 0) {
                console.log(`- Migrando ${records.length} registros da tabela ${src} como evoluções`);
                for (const rec of records) {
                    const profId = AXIOM_PROF_MAP[String(rec.profissionail_id)] || AXIOM_PROF_MAP["1"];
                    const dateRaw = rec.data_hora || rec.dhup;
                    // Fix date format: Feegow uses YYYY-MM-DD HH:mm:ss in local time. 
                    // To show correctly in Axiom (stored as timestamptz), we append -03:00.
                    const dateISO = dateRaw.replace(' ', 'T') + '-03:00';

                    await supabase.from('patient_records').insert({
                        organization_id: ORG_ID,
                        patient_id: patientId,
                        professional_id: profId,
                        status: 'finalized', // [FIX] Ensure it is signed/finalized to show up
                        content: {
                            text: rec.conteudo_resumo,
                            _record_type: 'evolution',
                            _source_form: src
                        },
                        created_at: dateISO,
                        updated_at: dateISO
                    });
                }
            }
        }

        // Assessment (Structured Palmilha Form)
        const pPalmilhas = f12Structured.filter(f => normalize(f.NomePaciente) === normalize(name));
        console.log(`- Migrando ${pPalmilhas.length} formulários estruturados de palmilha`);
        for (const f of pPalmilhas) {
            try {
                const raw = JSON.parse(f.campo || "{}");
                const dateISO = f.DataHora.replace(' ', 'T') + '-03:00';
                await supabase.from('patient_records').insert({
                    organization_id: ORG_ID, patient_id: patientId, professional_id: AXIOM_PROF_MAP["1"],
                    status: 'finalized',
                    content: {
                        biomechanics: raw,
                        _record_type: 'assessment',
                        _template_name: 'Consulta Palmilha (Feegow)'
                    },
                    created_at: dateISO, updated_at: dateISO
                });
            } catch (e) { }
        }
    }

    // 4. SYNC AGENDA (JAN 19-23)
    console.log("\nSincronizando agenda Jan 19-23 com correções...");
    const statusMap = {
        1: 'scheduled', 2: 'attended', 3: 'attended', 4: 'scheduled',
        5: 'scheduled', 6: 'no_show', 7: 'scheduled', 11: 'cancelled',
        15: 'scheduled', 22: 'cancelled', 208: 'attended'
    };

    const weekAg = agData.filter(a => a.Data >= "2026-01-19" && a.Data <= "2026-01-23");
    console.log(`Encontrados ${weekAg.length} agendamentos no Feegow.`);

    const patientCache = {};

    for (const a of weekAg) {
        const feegowPtId = String(a.paciente_id);
        let axiomPtId = patientCache[feegowPtId];

        if (!axiomPtId) {
            const pInfo = ptsData.find(pt => String(pt.id) === feegowPtId);
            if (!pInfo) continue;
            let { data: axiomPt } = await supabase.from('patients').select('id').eq('name', pInfo.nome_paciente).maybeSingle();
            if (!axiomPt) {
                const { data: newPt } = await supabase.from('patients').insert({
                    organization_id: ORG_ID, name: pInfo.nome_paciente, phone: String(pInfo.celular || "")
                }).select().single();
                axiomPt = newPt;
            }
            axiomPtId = axiomPt.id;
            patientCache[feegowPtId] = axiomPtId;
        }

        // Timezone Fix for Agenda
        const startTimeStr = `${a.Data}T${a.Hora || "08:00:00"}-03:00`;
        const durationMin = parseInt(a.tempo) || 45;
        const start = new Date(startTimeStr);
        const end = new Date(start.getTime() + durationMin * 60000);

        // Convert end to ISO with -03:00 offset too for consistency
        // offset 3 hours = 180 mins. 
        const offset = -180;
        const endISO = new Date(end.getTime() - (offset * 60000)).toISOString().replace('Z', '-03:00');
        // Actually simpler:
        const endStr = end.toLocaleString('sv-SE').replace(' ', 'T') + '-03:00';

        const professionalId = AXIOM_PROF_MAP[String(a.profissional_id)] || AXIOM_PROF_MAP["1"];

        await supabase.from('appointments').insert({
            organization_id: ORG_ID,
            patient_id: axiomPtId,
            professional_id: professionalId,
            status: statusMap[a.status_id] || 'scheduled',
            start_time: startTimeStr,
            end_time: endStr,
            notes: `Importado Feegow | ID: ${a.id}`
        });
    }

    console.log("Migração de teste v5 concluída!");
}

migrate();
