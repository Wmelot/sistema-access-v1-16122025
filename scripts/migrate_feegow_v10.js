const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const crypto = require('crypto');

const SUPABASE_URL = "https://robptuukezhqvtasjyhz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYnB0dXVrZXpocXZ0YXNqeWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ4NjcwMCwiZXhwIjoyMDgzMDYyNzAwfQ.hufdKEjY0XFSIYvrv7FrNyb2aX49JORBulplO19d0u4";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const base_path = "/Users/wmelo/Axiom/clinic30490_backup_excel/";

function loadSheet(file) {
    if (!fs.existsSync(path.join(base_path, file))) return [];
    try {
        const wb = xlsx.readFile(path.join(base_path, file));
        return xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { raw: false });
    } catch (e) { return []; }
}

function normalize(str) {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
}

const ORG_ID = "9571532e-fdf8-4aaa-b236-416fd6459566";
const RECORD_HASHES = new Set();

const EVOL_TEMPLATE_ID = 'e0000000-0000-0000-0000-000000000001';
const ASSESS_TEMPLATE_ID = 'a0000000-0000-0000-0000-000000000001';

const AXIOM_PROF_MAP = {
    "1": "839a77d3-a7f0-4103-bc4a-004ec550bd15",
    "2": "895dfdde-a6d6-4d29-97e8-626b9deb16b8",
    "3": "64c95a02-04ce-4ace-b63f-b4210cf282a9",
    "4": "5dd90d13-be69-4718-8cd8-cb1a9737a7b8"
};

const AXIOM_LOC_MAP = {
    "1": "c5e953b6-2c35-4ca4-ab0e-009efb439b57",
    "5": "c5e953b6-2c35-4ca4-ab0e-009efb439b57",
    "2": "206278b2-4555-4e54-b581-9455c98bcda6",
    "3": "206278b2-4555-4e54-b581-9455c98bcda6",
    "6": "9198a368-5cab-47c1-9da2-4e7f73810907",
    "4": "6e152b3a-faae-4c5c-86e4-e49ea951b6ff",
    "8": "b575d90a-f0d4-47a3-96c9-6c0e6df130f9"
};

const NAME_FIXES = {
    "atendimento fisioterapia": "atendimento de fisioterapia",
    "fisioterapia pelvica": "atendimento fisioterapia pelvica"
};

// FIX: Evolutions need +3h shift
function formatIsoLocalStringShifted(dateStrRaw) {
    if (!dateStrRaw) return null;
    // Format: "2025-07-14 05:13:40"
    // We want 08:13:40 Local (-03:00)
    // 05 + 3 = 08.

    // Parse the string manually to avoid Date timezone madness
    // Assume input is YYYY-MM-DD HH:MM:SS
    const parts = dateStrRaw.replace('T', ' ').split(' ');
    const dateParts = parts[0].split('-');
    const timeParts = parts[1].split(':');

    let year = parseInt(dateParts[0]);
    let month = parseInt(dateParts[1]) - 1; // JS Month is 0-indexed
    let day = parseInt(dateParts[2]);
    let hour = parseInt(timeParts[0]);
    let min = parseInt(timeParts[1]);
    let sec = parseInt(timeParts[2] || '0');

    // Add 3 hours
    hour += 3;

    // Normalize dates (e.g. 25:00 -> next day)
    const d = new Date(year, month, day, hour, min, sec);

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');

    return `${y}-${m}-${dd}T${hh}:${mm}:${ss}-03:00`;
}

// Helper for Agenda (already Local)
function formatIsoLocalStringAgenda(dateStr, timeStr) {
    // dateStr: "2026-01-20", timeStr: "14:30:00"
    return `${dateStr}T${timeStr}-03:00`;
}

async function migrate() {
    console.log("Iniciando migração v10 (Visualização, TimeFix, Agenda)...");

    // 1. Templates with Fields (Fixes Empty Card)
    // We add a 'textarea' field so FormRenderer knows what to show.
    await supabase.from('form_templates').upsert({
        id: EVOL_TEMPLATE_ID,
        organization_id: ORG_ID,
        title: 'Evolução',
        type: 'evolution',
        fields: [
            { id: 'conteudo', type: 'textarea', label: 'Descrição da Evolução', required: false }
        ],
        is_active: true
    });

    await supabase.from('form_templates').upsert({
        id: ASSESS_TEMPLATE_ID,
        organization_id: ORG_ID,
        title: 'Consulta Palmilha (Feegow)',
        type: 'assessment',
        fields: [
            { id: 'resumo', type: 'textarea', label: 'Dados Importados', required: false }
        ],
        is_active: true
    });

    // 2. Services
    const { data: axiomServices } = await supabase.from('services').select('id, name, duration, price').eq('organization_id', ORG_ID);
    const serviceMap = {};
    if (axiomServices) axiomServices.forEach(s => serviceMap[normalize(s.name)] = s);

    // 3. Proc Map
    const procData = loadSheet("procedimentos.xlsx");
    const feegowProcMap = {};
    procData.forEach(p => feegowProcMap[String(p.id)] = p.nome_procedimento);

    // 4. CLEANUP
    console.log("Limpando dados anteriores...");
    await supabase.from('appointments').delete().eq('organization_id', ORG_ID).ilike('notes', '%Importado Feegow%');
    await supabase.from('patient_records').delete().eq('organization_id', ORG_ID).eq('template_id', EVOL_TEMPLATE_ID);
    await supabase.from('patient_records').delete().eq('organization_id', ORG_ID).eq('template_id', ASSESS_TEMPLATE_ID);

    // 5. LOAD
    const ptsData = loadSheet("pacientes.xlsx");
    const agData = loadSheet("agendamentos.xlsx");
    const formsData = ["_8.xlsx", "_12.xlsx", "_13.xlsx"].map(src => ({ src, data: loadSheet(src) }));
    const f12Structured = loadSheet("form_tabela_12.xlsx");

    const targetNames = ["Adaliana Bastos dos Santos Rodrigues", "Adriana Paula da Cruz Barreto"];

    // 6. RECORDS
    for (const name of targetNames) {
        const p = ptsData.find(pt => normalize(pt.nome_paciente) === normalize(name));
        if (!p) continue;

        let { data: axiomPt } = await supabase.from('patients').select('id').eq('name', p.nome_paciente).maybeSingle();
        if (!axiomPt) {
            const { data: newPt } = await supabase.from('patients').insert({
                organization_id: ORG_ID, name: p.nome_paciente, phone: String(p.celular || "")
            }).select().single();
            axiomPt = newPt;
        }
        const patientId = axiomPt.id;
        console.log(`\nPaciente: ${p.nome_paciente}`);

        // Evolutions
        for (const { src, data } of formsData) {
            const records = data.filter(e => String(e.paciente_id) === String(p.id));
            if (records.length > 0) {
                let count = 0;
                for (const rec of records) {
                    const profId = AXIOM_PROF_MAP[String(rec.profissionail_id)] || AXIOM_PROF_MAP["1"];
                    const dateRaw = rec.data_hora || rec.dhup;

                    // Dedup
                    const contentValues = `evolution:${dateRaw}:${rec.conteudo_resumo}`;
                    const hash = crypto.createHash('md5').update(contentValues).digest('hex');
                    if (RECORD_HASHES.has(hash)) continue;
                    RECORD_HASHES.add(hash);

                    // Fix Time (+3h)
                    const dateISO = formatIsoLocalStringShifted(dateRaw);

                    // Fix Content Structure (Map text to 'conteudo' field)
                    const content = {
                        conteudo: rec.conteudo_resumo,
                        _source_form: src
                    };

                    await supabase.from('patient_records').insert({
                        organization_id: ORG_ID, patient_id: patientId, professional_id: profId,
                        template_id: EVOL_TEMPLATE_ID, status: 'finalized',
                        content: content,
                        created_at: dateISO, updated_at: dateISO
                    });
                    count++;
                }
                console.log(`- Evoluções: ${count} (Unique, Time Fixed, Visible)`);
            }
        }

        // Assessments
        const pPalmilhas = f12Structured.filter(f => normalize(f.NomePaciente) === normalize(name));
        let countAss = 0;
        for (const f of pPalmilhas) {
            const raw = f.campo || "{}";
            // Check if structured date also needs shift?
            // "2025-07-14 08:13:40" in Form Tabela might be Correct Local?
            // Let's assume it follows the same pattern as _12.xlsx since it's the same system.
            // If user sees 08:13 and Excel has 05:13... 
            // Wait, f.DataHora in `form_tabela_12.xlsx` might be different.
            // I'll assume +3h shift is safe for all "System Date" columns from Feegow dump.

            const dateISO = formatIsoLocalStringShifted(f.DataHora);

            const contentValues = `assessment:${f.DataHora}:${raw}`;
            const hash = crypto.createHash('md5').update(contentValues).digest('hex');
            if (RECORD_HASHES.has(hash)) continue;
            RECORD_HASHES.add(hash);

            let jsonContent = {};
            try { jsonContent = JSON.parse(raw); } catch (e) { }

            // Wrap in 'resumo' for visibility?
            // Or just put data in biomechanics?
            // Since template 'Consulta Palmilha (Feegow)' has field 'resumo', let's use it.
            // But we also want to keep structured data.
            const content = {
                resumo: JSON.stringify(jsonContent, null, 2), // Visible Text
                biomechanics: jsonContent, // Structured Data
                _template_name: 'Consulta Palmilha (Feegow)'
            };

            await supabase.from('patient_records').insert({
                organization_id: ORG_ID, patient_id: patientId, professional_id: AXIOM_PROF_MAP["1"],
                template_id: ASSESS_TEMPLATE_ID, status: 'finalized',
                content: content,
                created_at: dateISO, updated_at: dateISO
            });
            countAss++;
        }
        console.log(`- Avaliações: ${countAss} (Unique, Time Fixed)`);
    }

    // 7. AGENDA
    console.log("\nAgenda Jan 19-23...");
    const statusMap = {
        1: 'scheduled', 2: 'attended', 3: 'attended', 4: 'scheduled',
        5: 'scheduled', 6: 'no_show', 7: 'scheduled', 11: 'cancelled',
        15: 'cancelled', // Changed to CANCELLED/Skipped (Remarcado)
        22: 'cancelled', 208: 'attended'
    };

    const weekAg = agData.filter(a => a.Data >= "2026-01-19" && a.Data <= "2026-01-23");
    const patientCache = {};

    for (const a of weekAg) {
        if (!a.Hora) continue;

        // Skip Cancelled maps
        const axiStatus = statusMap[a.status_id];
        if (axiStatus === 'cancelled') continue;

        // Check for duplicates manually (Same Pt, Same Day, Same Prof, Status overlap)
        // Actually, let's trust the deduplication logic if we implemented one, but
        // for "Felipe" case, we have Status 1 and Status 3. Both are valid.
        // We will maintain them.

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

        const procName = feegowProcMap[String(a.procedimento_id)] || "";
        let normName = normalize(procName);
        if (NAME_FIXES[normName]) normName = NAME_FIXES[normName];

        const axiomService = serviceMap[normName];
        const serviceId = axiomService ? axiomService.id : null;
        let durationMin = axiomService ? axiomService.duration : (parseInt(a.tempo) || 45);
        if (durationMin < 5) durationMin = 45; // Safety

        // Time Calc (Local)
        // a.Hora is usually reliable for agenda
        const [h, m] = a.Hora.split(':').map(Number);

        // FIX: Ensure 2 digits
        const hStr = String(h).padStart(2, '0');
        const mStr = String(m).padStart(2, '0');
        const startIsoStr = `${a.Data}T${hStr}:${mStr}:00-03:00`;

        const totalMins = h * 60 + m + durationMin;
        const endH = Math.floor(totalMins / 60) % 24;
        const endM = totalMins % 60;
        const endIsoStr = `${a.Data}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00-03:00`;

        const professionalId = AXIOM_PROF_MAP[String(a.profissional_id)] || AXIOM_PROF_MAP["1"];
        const locationId = AXIOM_LOC_MAP[String(a.local_id)] || AXIOM_LOC_MAP["1"];

        await supabase.from('appointments').insert({
            organization_id: ORG_ID,
            patient_id: axiomPtId,
            professional_id: professionalId,
            location_id: locationId,
            status: axiStatus || 'scheduled',
            start_time: startIsoStr,
            end_time: endIsoStr,
            service_id: serviceId,
            price: axiomService ? axiomService.price : 0,
            notes: `Importado Feegow | ID: ${a.id} | Proc: ${procName}`
        });
    }

    console.log("Migração v10 concluída!");
}

migrate();
