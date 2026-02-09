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

// Static IDs for Templates to ensure stability
const EVOL_TEMPLATE_ID = 'e0000000-0000-0000-0000-000000000001';
const ASSESS_TEMPLATE_ID = 'a0000000-0000-0000-0000-000000000001';

const AXIOM_PROF_MAP = {
    "1": "839a77d3-a7f0-4103-bc4a-004ec550bd15", // Warley
    "2": "895dfdde-a6d6-4d29-97e8-626b9deb16b8", // Felipe
    "3": "64c95a02-04ce-4ace-b63f-b4210cf282a9", // Fábio
    "4": "5dd90d13-be69-4718-8cd8-cb1a9737a7b8"  // Rayane
};

const AXIOM_LOC_MAP = {
    "1": "c5e953b6-2c35-4ca4-ab0e-009efb439b57", // C1
    "5": "c5e953b6-2c35-4ca4-ab0e-009efb439b57", // C1
    "2": "206278b2-4555-4e54-b581-9455c98bcda6", // C2
    "3": "206278b2-4555-4e54-b581-9455c98bcda6", // C2
    "6": "9198a368-5cab-47c1-9da2-4e7f73810907", // C3
    "4": "6e152b3a-faae-4c5c-86e4-e49ea951b6ff", // Ginásio
    "8": "b575d90a-f0d4-47a3-96c9-6c0e6df130f9"  // Domiciliar
};

function formatIsoLocal(date, offsetHours = -3) {
    // Correct way to generate a string that represents the wall-clock time in its original timezone
    // but formatted in a way that timestamptz understands correctly.
    // Since Feegow exports are wall-clock local (-03:00).
    const d = new Date(date.getTime() + (offsetHours * 60 * 60 * 1000));
    return d.toISOString().replace('Z', '').split('.')[0] + "-03:00";
}

async function migrate() {
    console.log("Iniciando migração v7 (Final Fixes)...");

    // 1. Ensure Templates
    console.log("Garantindo templates de formulário...");
    await supabase.from('form_templates').upsert({
        id: EVOL_TEMPLATE_ID, organization_id: ORG_ID, title: 'Evolução', type: 'evolution', fields: [], is_active: true
    });
    await supabase.from('form_templates').upsert({
        id: ASSESS_TEMPLATE_ID, organization_id: ORG_ID, title: 'Consulta Palmilha (Feegow)', type: 'assessment', fields: [], is_active: true
    });

    // 2. CLEANUP
    console.log("Limpando dados anteriores...");
    await supabase.from('appointments').delete().eq('organization_id', ORG_ID).ilike('notes', '%Importado Feegow%');
    await supabase.from('patient_records').delete().eq('organization_id', ORG_ID).or('content->>_source_form.is.not.null,content->>_template_name.eq.Consulta Palmilha (Feegow)');

    // 3. LOAD
    const ptsData = loadSheet("pacientes.xlsx");
    const agData = loadSheet("agendamentos.xlsx");
    const formsData = ["_8.xlsx", "_12.xlsx", "_13.xlsx"].map(src => ({ src, data: loadSheet(src) }));
    const f12Structured = loadSheet("form_tabela_12.xlsx");

    const targetNames = ["Adaliana Bastos dos Santos Rodrigues", "Adriana Paula da Cruz Barreto"];

    // 4. PROCESS RECORDS
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
        console.log(`\nPaciente: ${p.nome_paciente} (${patientId})`);

        // Summaries as Evolutions
        for (const { src, data } of formsData) {
            const records = data.filter(e => String(e.paciente_id) === String(p.id));
            if (records.length > 0) {
                console.log(`- Migrando ${records.length} registros de ${src} como Evolução`);
                for (const rec of records) {
                    const profId = AXIOM_PROF_MAP[String(rec.profissionail_id)] || AXIOM_PROF_MAP["1"];
                    const dateRaw = rec.data_hora || rec.dhup;
                    const dateISO = dateRaw.replace(' ', 'T') + '-03:00';

                    await supabase.from('patient_records').insert({
                        organization_id: ORG_ID, patient_id: patientId, professional_id: profId,
                        template_id: EVOL_TEMPLATE_ID, status: 'finalized',
                        content: { text: rec.conteudo_resumo, _record_type: 'evolution', _source_form: src },
                        created_at: dateISO, updated_at: dateISO
                    });
                }
            }
        }

        // Structured as Assessments
        const pPalmilhas = f12Structured.filter(f => normalize(f.NomePaciente) === normalize(name));
        console.log(`- Migrando ${pPalmilhas.length} registros de form_tabela_12 como Avaliações`);
        for (const f of pPalmilhas) {
            try {
                const raw = JSON.parse(f.campo || "{}");
                const dateISO = f.DataHora.replace(' ', 'T') + '-03:00';
                await supabase.from('patient_records').insert({
                    organization_id: ORG_ID, patient_id: patientId, professional_id: AXIOM_PROF_MAP["1"],
                    template_id: ASSESS_TEMPLATE_ID, status: 'finalized',
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

        const durationMin = parseInt(a.tempo) || 45;
        const start = new Date(`${a.Data}T${a.Hora || "08:00:00"}-03:00`);
        const end = new Date(start.getTime() + durationMin * 60000);

        // Correct String Generation for -03:00 to avoid 3h shift
        const startStr = formatIsoLocal(start, -3);
        const endStr = formatIsoLocal(end, -3);

        const professionalId = AXIOM_PROF_MAP[String(a.profissional_id)] || AXIOM_PROF_MAP["1"];
        const locationId = AXIOM_LOC_MAP[String(a.local_id)] || AXIOM_LOC_MAP["1"];

        await supabase.from('appointments').insert({
            organization_id: ORG_ID,
            patient_id: axiomPtId,
            professional_id: professionalId,
            location_id: locationId,
            status: statusMap[a.status_id] || 'scheduled',
            start_time: startStr,
            end_time: endStr,
            notes: `Importado Feegow | ID: ${a.id}`
        });
    }

    console.log("Migração v7 finalizada!");
}

migrate();
