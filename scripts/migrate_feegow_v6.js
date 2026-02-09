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

const ORG_ID = "9571532e-fdf8-4aaa-b236-416fd6459566";

const AXIOM_PROF_MAP = {
    "1": "839a77d3-a7f0-4103-bc4a-004ec550bd15", // Warley
    "2": "895dfdde-a6d6-4d29-97e8-626b9deb16b8", // Felipe
    "3": "64c95a02-04ce-4ace-b63f-b4210cf282a9", // Fábio
    "4": "5dd90d13-be69-4718-8cd8-cb1a9737a7b8"  // Rayane
};

const AXIOM_LOC_MAP = {
    "1": "c5e953b6-2c35-4ca4-ab0e-009efb439b57", // Consultório 1
    "5": "c5e953b6-2c35-4ca4-ab0e-009efb439b57", // Consultório 1
    "2": "206278b2-4555-4e54-b581-9455c98bcda6", // Consultório 2
    "3": "206278b2-4555-4e54-b581-9455c98bcda6", // Consultório 2
    "6": "9198a368-5cab-47c1-9da2-4e7f73810907", // Consultório 3
    "4": "6e152b3a-faae-4c5c-86e4-e49ea951b6ff", // Ginásio
};

function formatIsoLocal(date, offsetHours = -3) {
    // Generate an ISO-like string that says "local time" but has the offset suffix
    // so Axiom interprets it correctly as the intended local wall-clock time.
    const d = new Date(date.getTime() + (offsetHours * 60 * 60 * 1000));
    return d.toISOString().replace('Z', '').split('.')[0] + "-03:00";
}

async function migrate() {
    console.log("Iniciando migração v6 (Fix Duration, Templates, Locations)...");

    // 1. Ensure Evolution Template Exists
    const evolTemplateId = 'e0000000-0000-0000-0000-000000000001';
    const assessmentTemplateId = 'a0000000-0000-0000-0000-000000000001';

    const { data: existingE } = await supabase.from('form_templates').select('id').eq('title', 'Evolução').maybeSingle();
    let finalEvolId = existingE?.id;
    if (!finalEvolId) {
        const { data: newE } = await supabase.from('form_templates').insert({
            id: evolTemplateId, organization_id: ORG_ID, title: 'Evolução', type: 'evolution', fields: []
        }).select().single();
        finalEvolId = newE?.id || evolTemplateId;
    }

    const { data: existingA } = await supabase.from('form_templates').select('id').eq('title', 'Consulta Palmilha (Feegow)').maybeSingle();
    let finalAssId = existingA?.id;
    if (!finalAssId) {
        const { data: newA } = await supabase.from('form_templates').insert({
            id: assessmentTemplateId, organization_id: ORG_ID, title: 'Consulta Palmilha (Feegow)', type: 'assessment', fields: []
        }).select().single();
        finalAssId = newA?.id || assessmentTemplateId;
    }

    // 2. CLEANUP
    console.log("Limpando dados anteriores...");
    await supabase.from('appointments').delete().eq('organization_id', ORG_ID).ilike('notes', '%Importado Feegow%');
    await supabase.from('patient_records').delete().eq('organization_id', ORG_ID).or('content->>_source_form.is.not.null,content->>_template_name.eq.Consulta Palmilha (Feegow)');

    // 3. LOAD DATA
    const ptsData = loadSheet("pacientes.xlsx");
    const agData = loadSheet("agendamentos.xlsx");
    const evolutionSources = ["_8.xlsx", "_12.xlsx", "_13.xlsx"]; // [FIX] Summary tables
    const formsData = evolutionSources.map(src => ({ src, data: loadSheet(src) }));
    const f12Structured = loadSheet("form_tabela_12.xlsx");

    const targetNames = ["Adaliana Bastos dos Santos Rodrigues", "Adriana Paula da Cruz Barreto"];

    // 4. PATIENTS & RECORDS
    for (const name of targetNames) {
        const p = ptsData.find(pt => normalize(pt.nome_paciente) === normalize(name));
        if (!p) continue;

        let { data: axiomPt } = await supabase.from('patients').select('id').eq('name', p.nome_paciente).maybeSingle();
        if (!axiomPt) {
            const { data: newPt } = await supabase.from('patients').insert({
                organization_id: ORG_ID, name: p.nome_paciente, cpf: p.cpf ? String(p.cpf) : null,
                phone: p.celular ? String(p.celular) : null, birthdate: p.nascimento || null, gender: p.sexo === 'F' ? 'female' : 'male'
            }).select().single();
            axiomPt = newPt;
        }
        const patientId = axiomPt.id;
        console.log(`\nPaciente: ${p.nome_paciente}`);

        for (const { src, data } of formsData) {
            const records = data.filter(e => String(e.paciente_id) === String(p.id));
            if (records.length > 0) {
                console.log(`- Migrando ${records.length} registros da tabela ${src} para Evoluções`);
                for (const rec of records) {
                    const profId = AXIOM_PROF_MAP[String(rec.profissionail_id)] || AXIOM_PROF_MAP["1"];
                    const dateRaw = rec.data_hora || rec.dhup;
                    const dateISO = dateRaw.replace(' ', 'T') + '-03:00';

                    await supabase.from('patient_records').insert({
                        organization_id: ORG_ID, patient_id: patientId, professional_id: profId,
                        template_id: finalEvolId, status: 'finalized',
                        content: { text: rec.conteudo_resumo, _record_type: 'evolution', _source_form: src },
                        created_at: dateISO, updated_at: dateISO
                    });
                }
            }
        }

        const pPalmilhas = f12Structured.filter(f => normalize(f.NomePaciente) === normalize(name));
        console.log(`- Migrando ${pPalmilhas.length} formulários estruturados para Avaliações`);
        for (const f of pPalmilhas) {
            try {
                const raw = JSON.parse(f.campo || "{}");
                const dateISO = f.DataHora.replace(' ', 'T') + '-03:00';
                await supabase.from('patient_records').insert({
                    organization_id: ORG_ID, patient_id: patientId, professional_id: AXIOM_PROF_MAP["1"],
                    template_id: finalAssId, status: 'finalized',
                    content: { biomechanics: raw, _record_type: 'assessment', _template_name: 'Consulta Palmilha (Feegow)' },
                    created_at: dateISO, updated_at: dateISO
                });
            } catch (e) { }
        }
    }

    // 5. AGENDA
    console.log("\nSincronizando agenda Jan 19-23...");
    const statusMap = {
        1: 'scheduled', 2: 'attended', 3: 'attended', 4: 'scheduled',
        5: 'scheduled', 6: 'no_show', 7: 'scheduled', 11: 'cancelled',
        15: 'scheduled', 22: 'cancelled', 208: 'attended'
    };

    const weekAg = agData.filter(a => a.Data >= "2026-01-19" && a.Data <= "2026-01-23");
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

        const start = new Date(`${a.Data}T${a.Hora || "08:00:00"}-03:00`);
        const durationMin = parseInt(a.tempo) || 45;
        const end = new Date(start.getTime() + durationMin * 60000);

        // Correct Shift: Use formatIsoLocal to ensure the string represents the wall-clock time correctly in -03:00
        const startStr = formatIsoLocal(start, 0); // start is already 05:45 local. formatIsoLocal with 0 shift keeps it 05:45.
        const endStr = formatIsoLocal(end, 0);

        await supabase.from('appointments').insert({
            organization_id: ORG_ID,
            patient_id: axiomPtId,
            professional_id: AXIOM_PROF_MAP[String(a.profissional_id)] || AXIOM_PROF_MAP["1"],
            location_id: AXIOM_LOC_MAP[String(a.local_id)] || AXIOM_LOC_MAP["1"],
            status: statusMap[a.status_id] || 'scheduled',
            start_time: startStr,
            end_time: endStr,
            notes: `Importado Feegow | ID: ${a.id}`
        });
    }

    console.log("Migração v6 concluída com sucesso!");
}

migrate();
