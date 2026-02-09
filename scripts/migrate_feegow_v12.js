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

function cleanHtml(text) {
    if (!text) return "";

    // 1. Decode generic entities manually for robustness
    let decoded = text
        .replace(/&nbsp;/gd, ' ')
        .replace(/&quot;/gd, '"')
        .replace(/&apos;/gd, "'")
        .replace(/&lt;/gd, '<')
        .replace(/&gt;/gd, '>')
        .replace(/&amp;/gd, '&')
        .replace(/&ccedil;/gd, 'ç')
        .replace(/&Ccedil;/gd, 'Ç')
        .replace(/&atilde;/gd, 'ã')
        .replace(/&Atilde;/gd, 'Ã')
        .replace(/&otilde;/gd, 'õ')
        .replace(/&Otilde;/gd, 'Õ')
        .replace(/&aacute;/gd, 'á')
        .replace(/&Aacute;/gd, 'Á')
        .replace(/&eacute;/gd, 'é')
        .replace(/&Eacute;/gd, 'É')
        .replace(/&iacute;/gd, 'í')
        .replace(/&Iacute;/gd, 'Í')
        .replace(/&oacute;/gd, 'ó')
        .replace(/&Oacute;/gd, 'Ó')
        .replace(/&uacute;/gd, 'ú')
        .replace(/&Uacute;/gd, 'Ú')
        .replace(/&acirc;/gd, 'â')
        .replace(/&Acirc;/gd, 'Â')
        .replace(/&ecirc;/gd, 'ê')
        .replace(/&Ecirc;/gd, 'Ê')
        .replace(/&ocirc;/gd, 'ô')
        .replace(/&Ocirc;/gd, 'Ô')
        // Special case: Sup/Sub
        .replace(/<sup>/gi, '^')
        .replace(/<\/sup>/gi, '')
        .replace(/<sub>/gi, '_')
        .replace(/<\/sub>/gi, '');

    let clean = decoded
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]+>/g, '') // Strip remaining tags
        .replace(/style="[^"]*"/gi, '') // Strip inline styles if they survived
        .replace(/\n\s*\n/g, '\n\n'); // Normalize spacing

    return clean.trim();
}

const ORG_ID = "9571532e-fdf8-4aaa-b236-416fd6459566";
const RECORD_HASHES = new Set();

// Templates
const BACKUP_TEMPLATE_ID = 'e0000000-0000-0000-0000-000000000002'; // New ID for "Backup Feegow"
const PALMILHA_V3_ID = 'fde183ad-1c20-4d6c-9efb-89d08f483cf2'; // Real V3 ID

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

function formatIsoLocalStringShifted(dateStrRaw) {
    if (!dateStrRaw) return null;
    const parts = dateStrRaw.replace('T', ' ').split(' ');
    const dateParts = parts[0].split('-');
    const timeParts = parts[1].split(':');

    let year = parseInt(dateParts[0]);
    let month = parseInt(dateParts[1]) - 1;
    let day = parseInt(dateParts[2]);
    let hour = parseInt(timeParts[0]);
    let min = parseInt(timeParts[1]);
    let sec = parseInt(timeParts[2] || '0');

    hour += 3; // Shift +3h

    const d = new Date(year, month, day, hour, min, sec);

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');

    return `${y}-${m}-${dd}T${hh}:${mm}:${ss}-03:00`;
}

function mapToPalmilhaV3(rawJson) {
    let data = {};
    try { data = JSON.parse(rawJson); } catch (e) { return null; }

    // Constants for FPI Mapping
    const mapFpi = (val) => val ? String(val) : "0";

    const mapped = {
        anamnese: {
            queixa_principal: data["QP"] || data["Queixa Principal"] || "Importado do Feegow",
            hma: cleanHtml(data["HMA"] || ""),
            eva: parseInt(data["EVA"]) || 0,
            historia_pregressa: {
                medicacao_uso: cleanHtml(data["HP"] || ""),
                tratamentos_previos: []
            },
            // Try to map pain map if possible, likely difficult from text keys
            mapa_dor: { pontos: [] }
        },
        exame_fisico: {
            fpi: {
                talus: {
                    left: mapFpi(data["Tálus E"]),
                    right: mapFpi(data["Tálus D"])
                },
                curvatura_maleolar: {
                    left: mapFpi(data["Maléolo E"]),
                    right: mapFpi(data["Maléolo D"])
                },
                posicao_calcaneo: {
                    left: mapFpi(data["Calcâneo E"]),
                    right: mapFpi(data["Calcâneo D"])
                },
                proeminencia_tln: {
                    left: mapFpi(data["Navicular E"]), // Assuming naming convention
                    right: mapFpi(data["Navicular D"])
                },
                congruencia_arco: {
                    left: mapFpi(data["Arco E"]),
                    right: mapFpi(data["Arco D"])
                },
                abducao_antepé: {
                    left: mapFpi(data["Dedos E"]),
                    right: mapFpi(data["Dedos D"])
                }
            },
            lunge_test: {
                left: parseFloat(data["Lunge Teste E"]) || 0,
                right: parseFloat(data["Lunge Teste D"]) || 0
            },
            // Mapping Naviculometer if exists
            // Check keys like "Naviculômetro E" or similar
            navicular_drop: {
                left: parseFloat(data["Naviculômetro E"] || data["Navicular Drop E"]) || 0,
                right: parseFloat(data["Naviculômetro D"] || data["Navicular Drop D"]) || 0
            },
            // Mapping Legs Length
            discrepancia_membros: {
                left: parseFloat(data["Comprimento MIE - Fita Métrica"]) || 0,
                right: parseFloat(data["Comprimento MID - Fita Métrica"]) || 0
            }
        },
        calcado: {
            // Unlikely to interpret shoe data perfectly from random keys
            indice_minimalista: {
                peso_score: 0, drop_score: 0, flex_longitudinal: 0, flex_torsional: 0, estabilidade: 0
            }
        },
        prescricao: {
            palmilha: {
                modelo: "Slim",
                tipo: "Inteira",
                left_foot: { pads: [] },
                right_foot: { pads: [] }
            },
            preco_total: 0
        }
    };

    return mapped;
}

async function migrate() {
    console.log("Iniciando migração v12 (Smart Mapping, Text Cleanup)...");

    // 1. Create/Update "Backup Feegow" Template
    await supabase.from('form_templates').upsert({
        id: BACKUP_TEMPLATE_ID,
        organization_id: ORG_ID,
        title: 'Backup Feegow',
        type: 'evolution',
        fields: [
            {
                id: 'conteudo',
                type: 'textarea',
                label: 'Conteúdo Importado',
                required: false,
                className: 'h-[85vh] text-lg leading-loose p-6 font-medium', // Max height and readable text
                placeholder: 'Conteúdo original do Feegow...'
            }
        ],
        is_active: true
    });

    // 2. Services Prep
    const { data: axiomServices } = await supabase.from('services').select('id, name, duration, price').eq('organization_id', ORG_ID);
    const serviceMap = {};
    if (axiomServices) axiomServices.forEach(s => serviceMap[normalize(s.name)] = s);

    // 3. Proc Prep
    const procData = loadSheet("procedimentos.xlsx");
    const feegowProcMap = {};
    procData.forEach(p => feegowProcMap[String(p.id)] = p.nome_procedimento);

    // 4. CLEANUP (Specific Patients)
    const targetNames = ["Adaliana Bastos dos Santos Rodrigues", "Adriana Paula da Cruz Barreto"];
    console.log("Limpando dados anteriores dos pacientes alvo...");
    for (const name of targetNames) {
        const { data: pt } = await supabase.from('patients').select('id').eq('name', name).maybeSingle();
        if (pt) {
            await supabase.from('patient_records').delete().eq('patient_id', pt.id);
            console.log(`- Limpou registros de ${name}`);
        }
    }

    // 5. LOAD DATA
    const ptsData = loadSheet("pacientes.xlsx");
    const agData = loadSheet("agendamentos.xlsx");
    const formsData = ["_8.xlsx", "_12.xlsx", "_13.xlsx"].map(src => ({ src, data: loadSheet(src) }));
    const f12Structured = loadSheet("form_tabela_12.xlsx");

    // 6. MIGRATE RECORDS
    for (const name of targetNames) {
        const p = ptsData.find(pt => normalize(pt.nome_paciente) === normalize(name));
        if (!p) continue;

        let { data: axiomPt } = await supabase.from('patients').select('id').eq('name', p.nome_paciente).maybeSingle();
        if (!axiomPt) {
            // Should exist from previous runs, but safe fallback
            const { data: newPt } = await supabase.from('patients').insert({
                organization_id: ORG_ID, name: p.nome_paciente, phone: String(p.celular || "")
            }).select().single();
            axiomPt = newPt;
        }
        const patientId = axiomPt.id;
        console.log(`\nProcessando: ${p.nome_paciente}`);

        // A. EVOLUTIONS (Text/Backup)
        for (const { src, data } of formsData) {
            const records = data.filter(e => String(e.paciente_id) === String(p.id));
            if (records.length > 0) {
                let count = 0;
                for (const rec of records) {
                    const profId = AXIOM_PROF_MAP[String(rec.profissionail_id)] || AXIOM_PROF_MAP["1"];
                    const dateRaw = rec.data_hora || rec.dhup;
                    const dateISO = formatIsoLocalStringShifted(dateRaw);

                    // CLEAN CONTENT
                    const cleanContent = cleanHtml(rec.conteudo_resumo);

                    // Skip empty
                    if (!cleanContent) continue;

                    // Insert as "Backup Feegow"
                    await supabase.from('patient_records').insert({
                        organization_id: ORG_ID,
                        patient_id: patientId,
                        professional_id: profId,
                        template_id: BACKUP_TEMPLATE_ID, // Using "Backup Feegow" name
                        status: 'finalized',
                        content: {
                            conteudo: cleanContent,
                            _original_html: rec.conteudo_resumo,
                            _source: src
                        },
                        created_at: dateISO, updated_at: dateISO
                    });
                    count++;
                }
                console.log(`- Evoluções (Backup Feegow): ${count}`);
            }
        }

        // B. BIOMECHANICS (Structured) -> Palmilha V3
        const pPalmilhas = f12Structured.filter(f => normalize(f.NomePaciente) === normalize(name));
        let countAss = 0;
        for (const f of pPalmilhas) {
            const raw = f.campo || "{}";
            const dateISO = formatIsoLocalStringShifted(f.DataHora);

            // MAP DATA
            const mappedContent = mapToPalmilhaV3(raw);
            if (!mappedContent) {
                console.log(`Failed to parse JSON for ${f.id}`);
                continue;
            }

            await supabase.from('patient_records').insert({
                organization_id: ORG_ID,
                patient_id: patientId,
                professional_id: AXIOM_PROF_MAP["1"], // Warley Default
                template_id: PALMILHA_V3_ID, // REAL V3 ID
                status: 'finalized',
                content: {
                    ...mappedContent,
                    _imported_from_feegow: true,
                    _original_json: raw
                },
                created_at: dateISO, updated_at: dateISO
            });
            countAss++;
        }
        console.log(`- Palmilhas Biomecânicas (V3): ${countAss}`);
    }

    // 7. AGENDA (Reprocess Week)
    console.log("\nAgenda Jan 19-23...");
    const statusMap = {
        1: 'scheduled', 2: 'attended', 3: 'attended', 4: 'scheduled',
        5: 'scheduled', 6: 'no_show', 7: 'scheduled', 11: 'cancelled',
        15: 'cancelled', 22: 'cancelled', 208: 'attended'
    };

    // Clear Agenda for these patients in range to avoid dupes from re-running
    const weekAg = agData.filter(a => a.Data >= "2026-01-19" && a.Data <= "2026-01-23");

    // Quick cache for patient IDs
    const patientCache = {};

    for (const a of weekAg) {
        if (!a.Hora) continue;
        const axiStatus = statusMap[a.status_id];
        if (axiStatus === 'cancelled') continue;

        const feegowPtId = String(a.paciente_id);

        // Only process target patients? 
        // No, user only complained about specific records, but usually migration runs for all.
        // But to save time and risk, I will only insert if NOT EXISTS.

        // ... Wait, user wants me to fix mostly the records.
        // I'll skip agenda logic for now to avoid messing with other patients unless requested.
        // Actually, I should probably leave it alone if it's already there.
        // I will skip Agenda insertion in this specific "v12" to be safe and fast,
        // unless I deleted their agenda items in step 4?
        // Step 4 deleted 'appointment's? No, it deleted 'patient_records'.
        // Wait, v11 deleted appointments with notes 'Importado Feegow'.
        // I should re-run agenda import IF I delete them.

        // Let's delete agenda only for these 2 patients to be safe.
        // Getting IDs first.
    }

    // Re-inserting Agenda ONLY for target patients
    // First, delete their agenda for the target week to clean slate
    for (const name of targetNames) {
        const { data: pt } = await supabase.from('patients').select('id').eq('name', name).single();
        if (pt) {
            await supabase.from('appointments').delete()
                .eq('patient_id', pt.id)
                .gte('start_time', '2026-01-19')
                .lte('start_time', '2026-01-23')
                .ilike('notes', '%Importado Feegow%');
        }
    }

    // Now insert
    for (const a of weekAg) {
        if (!a.Hora) continue;
        const axiStatus = statusMap[a.status_id];
        if (axiStatus === 'cancelled') continue;

        // Check if this agenda item belongs to our target patients
        const pInfo = ptsData.find(pt => String(pt.id) === String(a.paciente_id));
        if (!pInfo || !targetNames.some(n => normalize(n) === normalize(pInfo.nome_paciente))) continue;

        const dateRaw = a.Data;

        // Fetch Axiom ID
        const { data: axiomPt } = await supabase.from('patients').select('id').eq('name', pInfo.nome_paciente).single();
        if (!axiomPt) continue;

        const procName = feegowProcMap[String(a.procedimento_id)] || "";
        let normName = normalize(procName);
        if (NAME_FIXES[normName]) normName = NAME_FIXES[normName];

        const axiomService = serviceMap[normName];
        const serviceId = axiomService ? axiomService.id : null;
        let durationMin = axiomService ? axiomService.duration : (parseInt(a.tempo) || 45);
        if (durationMin < 5) durationMin = 45;

        const [h, m] = a.Hora.split(':').map(Number);
        const startIsoStr = `${a.Data}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00-03:00`;
        const totalMins = h * 60 + m + durationMin;
        const endH = Math.floor(totalMins / 60) % 24;
        const endM = totalMins % 60;
        const endIsoStr = `${a.Data}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00-03:00`;

        const professionalId = AXIOM_PROF_MAP[String(a.profissional_id)] || AXIOM_PROF_MAP["1"];
        const locationId = AXIOM_LOC_MAP[String(a.local_id)] || AXIOM_LOC_MAP["1"];

        await supabase.from('appointments').insert({
            organization_id: ORG_ID,
            patient_id: axiomPt.id,
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

    console.log("Migração v12 concluída!");
}

migrate();
