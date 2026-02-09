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
    } catch (e) {
        console.warn("Erro ao ler", file);
        return [];
    }
}

function normalize(str) {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
}

const ORG_ID = "9571532e-fdf8-4aaa-b236-416fd6459566";
const RECORD_HASHES = new Set(); // Dedup

// Static IDs
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

// Helper: Format ISO for Timestamptz correctly
// Receives Date object (which has correct hour values)
// Returns string like "2026-01-20T14:30:00-03:00"
function formatIsoLocalString(dateStrRaw) {
    if (!dateStrRaw) return null;
    // dateStrRaw ex: "2026-01-20" from 'Data' col, and "14:30:00" from 'Hora' col
    // OR "2025-07-14 05:13:40"
    // We want to construct the ISO string literally.
    const clean = dateStrRaw.replace(' ', 'T');
    // If it already has offset, ok. If not, append -03:00.
    if (clean.includes('+') || clean.split('T')[1]?.includes('-')) return clean;
    return clean + "-03:00";
}

async function migrate() {
    console.log("Iniciando migração v8 (Dedup, Services, Hourly Fix)...");

    // 1. Templates
    await supabase.from('form_templates').upsert({
        id: EVOL_TEMPLATE_ID, organization_id: ORG_ID, title: 'Evolução', type: 'evolution', fields: [], is_active: true
    });
    await supabase.from('form_templates').upsert({
        id: ASSESS_TEMPLATE_ID, organization_id: ORG_ID, title: 'Consulta Palmilha (Feegow)', type: 'assessment', fields: [], is_active: true
    });

    // 2. Fetch Services for Matching
    const { data: axiomServices } = await supabase.from('services').select('id, name, duration, price').eq('organization_id', ORG_ID);
    const serviceMap = {}; // Normalized Name -> Service Object
    axiomServices?.forEach(s => {
        serviceMap[normalize(s.name)] = s;
    });

    // 3. Load Procedimentos from Excel to link ID -> Name
    const procData = loadSheet("procedimentos.xlsx");
    const feegowProcMap = {}; // ID -> Name
    procData.forEach(p => {
        feegowProcMap[String(p.id)] = p.nome_procedimento;
    });

    // 4. CLEANUP (Targeted)
    console.log("Limpando dados anteriores (v7)...");
    await supabase.from('appointments').delete().eq('organization_id', ORG_ID).ilike('notes', '%Importado Feegow%');
    await supabase.from('patient_records').delete().eq('organization_id', ORG_ID).or('content->>_source_form.is.not.null,content->>_template_name.eq.Consulta Palmilha (Feegow)');

    // 5. LOAD MAIN DATA
    const ptsData = loadSheet("pacientes.xlsx");
    const agData = loadSheet("agendamentos.xlsx");
    const formsData = ["_8.xlsx", "_12.xlsx", "_13.xlsx"].map(src => ({ src, data: loadSheet(src) }));
    const f12Structured = loadSheet("form_tabela_12.xlsx");

    const targetNames = ["Adaliana Bastos dos Santos Rodrigues", "Adriana Paula da Cruz Barreto"];

    // 6. MIGRATE RECORDS (Deduped)
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

        // Evolutions
        for (const { src, data } of formsData) {
            const records = data.filter(e => String(e.paciente_id) === String(p.id));
            if (records.length > 0) {
                let count = 0;
                for (const rec of records) {
                    const profId = AXIOM_PROF_MAP[String(rec.profissionail_id)] || AXIOM_PROF_MAP["1"];
                    const dateRaw = rec.data_hora || rec.dhup;
                    const contentValues = `evolution:${dateRaw}:${rec.conteudo_resumo}`;
                    const hash = crypto.createHash('md5').update(contentValues).digest('hex');

                    if (RECORD_HASHES.has(hash)) continue; // Dedup
                    RECORD_HASHES.add(hash);

                    const dateISO = formatIsoLocalString(dateRaw);

                    await supabase.from('patient_records').insert({
                        organization_id: ORG_ID, patient_id: patientId, professional_id: profId,
                        template_id: EVOL_TEMPLATE_ID, status: 'finalized',
                        content: { text: rec.conteudo_resumo, _record_type: 'evolution', _source_form: src },
                        created_at: dateISO, updated_at: dateISO
                    });
                    count++;
                }
                console.log(`- Migrados ${count} registros únicos de ${src}`);
            }
        }

        // Assessments
        const pPalmilhas = f12Structured.filter(f => normalize(f.NomePaciente) === normalize(name));
        let countAss = 0;
        for (const f of pPalmilhas) {
            const raw = f.campo || "{}";
            const dateISO = formatIsoLocalString(f.DataHora);
            const contentValues = `assessment:${f.DataHora}:${raw}`;
            const hash = crypto.createHash('md5').update(contentValues).digest('hex');

            if (RECORD_HASHES.has(hash)) continue;
            RECORD_HASHES.add(hash);

            try {
                const jsonContent = JSON.parse(raw);
                await supabase.from('patient_records').insert({
                    organization_id: ORG_ID, patient_id: patientId, professional_id: AXIOM_PROF_MAP["1"],
                    template_id: ASSESS_TEMPLATE_ID, status: 'finalized',
                    content: { biomechanics: jsonContent, _record_type: 'assessment', _template_name: 'Consulta Palmilha (Feegow)' },
                    created_at: dateISO, updated_at: dateISO
                });
                countAss++;
            } catch (e) { }
        }
        console.log(`- Migrados ${countAss} formulários estruturados únicos`);
    }

    // 7. SYNC AGENDA
    console.log("\nSincronizando agenda Jan 19-23 com Serviços Corretos...");
    const statusMap = {
        1: 'scheduled', 2: 'attended', 3: 'attended', 4: 'scheduled',
        5: 'scheduled', 6: 'no_show', 7: 'scheduled', 11: 'cancelled',
        15: 'scheduled', 22: 'cancelled', 208: 'attended'
    };

    // Filter Week
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

        // Service Mapping
        const procName = feegowProcMap[String(a.procedimento_id)] || "";
        const axiomService = serviceMap[normalize(procName)];
        const serviceId = axiomService ? axiomService.id : null;

        let durationMin = 45; // Default fallback
        if (axiomService && axiomService.duration) {
            durationMin = axiomService.duration;
        } else if (a.tempo) {
            durationMin = parseInt(a.tempo);
        }

        // Time Calc: Use exact Excel strings + offset
        // a.Data = "2026-01-20"
        // a.Hora = "14:30:00"
        if (!a.Hora) continue; // Skip bad ones
        const startIsoStr = `${a.Data}T${a.Hora}-03:00`;
        const startDate = new Date(startIsoStr); // Creates correct UTC instant
        const endDate = new Date(startDate.getTime() + durationMin * 60000); // Add minutes

        // Reformat end date to string with -03:00 offset preserved
        // We need to shift it back to "local parts" to format string
        // If UTC is 17:30 (14:30 + 3), and we want "15:15-03:00" (which is 18:15 UTC)
        // We can just use toISOString() of the endDate object but replace Z? 
        // No, endDate is a Date obj. toISOString() gives UTC.
        // We know duration.
        // Let's parse hour/min from start string, add minutes, and build string manually?
        // Simpler: Use the UTC ISO string and replace it? No.
        // Safe way:
        const endLocal = new Date(endDate.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
        // But formatting JS dates is a pain.
        // Let's assume input Hora + Duration mins.
        const [h, m, s] = a.Hora.split(':').map(Number);
        const totalMins = h * 60 + m + durationMin;
        const endH = Math.floor(totalMins / 60) % 24;
        const endM = totalMins % 60;
        const endIsoStr = `${a.Data}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00-03:00`;

        const professionalId = AXIOM_PROF_MAP[String(a.profissional_id)] || AXIOM_PROF_MAP["1"];
        const locationId = AXIOM_LOC_MAP[String(a.local_id)] || AXIOM_LOC_MAP["1"];

        /*
        // Debug
        if (String(a.profissional_id) === "2" && a.Data === "2026-01-20") {
            console.log(`Felipe 20/01: ${a.Hora} -> ${startIsoStr} (${durationMin} min) -> ${endIsoStr}`);
        }
        */

        const axiStatus = statusMap[a.status_id] || 'scheduled';

        await supabase.from('appointments').insert({
            organization_id: ORG_ID,
            patient_id: axiomPtId,
            professional_id: professionalId,
            location_id: locationId,
            status: axiStatus,
            start_time: startIsoStr,
            end_time: endIsoStr,
            service_id: serviceId,
            price: axiomService ? axiomService.price : 0,
            notes: `Importado Feegow | ID: ${a.id} | Proc: ${procName || '?'}`
        });
    }

    console.log("Migração v8 concluída!");
}

migrate();
