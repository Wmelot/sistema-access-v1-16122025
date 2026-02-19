const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const SUPABASE_URL = "https://robptuukezhqvtasjyhz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYnB0dXVrZXpocXZ0YXNqeWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ4NjcwMCwiZXhwIjoyMDgzMDYyNzAwfQ.hufdKEjY0XFSIYvrv7FrNyb2aX49JORBulplO19d0u4";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const base_path = "/Users/wmelo/Axiom/clinic30490_backup_excel/";

const ORG_ID = "9571532e-fdf8-4aaa-b236-416fd6459566"; // Access Fisioterapia
const BACKUP_TEMPLATE_ID = 'e0000000-0000-0000-0000-000000000002';
const PALMILHA_V3_ID = 'fde183ad-1c20-4d6c-9efb-89d08f483cf2';

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
    return text.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, '').trim();
}

function formatIso(dateStrRaw) {
    if (!dateStrRaw) return null;
    try {
        // Assume format YYYY-MM-DD HH:MM:SS or ISO
        const d = new Date(dateStrRaw);
        if (isNaN(d.getTime())) return null;
        return d.toISOString();
    } catch (e) { return null; }
}

async function migrate() {
    console.log("🚀 Iniciando MIGRACAO FINAL FEEGOW...");

    // 1. Data Prep
    const ptsTable = loadSheet("pacientes.xlsx");
    const addrTable = loadSheet("paciente_endereco.xlsx");
    const agTable = loadSheet("agendamentos.xlsx");
    const procTable = loadSheet("procedimentos.xlsx");
    const formsFiles = ["_8.xlsx", "_12.xlsx", "_13.xlsx"];
    const biomechTable = loadSheet("form_tabela_12.xlsx");

    const addrMap = {};
    addrTable.forEach(a => {
        addrMap[String(a.paciente_id)] = {
            street: a.logradouro || null,
            number: a.numero || null,
            complement: a.complemento || null,
            neighborhood: a.bairro || null,
            city: a.cidade || null,
            state: a.estado || null,
            zip_code: a.cep || null
        };
    });

    const procMap = {};
    procTable.forEach(p => procMap[String(p.id)] = p.nome_procedimento);

    const { data: axiomServices } = await supabase.from('services').select('id, name').eq('organization_id', ORG_ID);
    const serviceMap = {};
    if (axiomServices) axiomServices.forEach(s => serviceMap[normalize(s.name)] = s.id);

    // 2. MIGRATE PATIENTS (Insert all)
    console.log(`- Importando ${ptsTable.length} pacientes...`);
    const feegowToAxiomPt = {};

    for (const p of ptsTable) {
        let birth = p.nascimento;
        if (!birth || birth === 'None' || birth === 'null') birth = null;

        const address = addrMap[String(p.id)] || {};

        const addressData = {
            street: address.street,
            number: address.number,
            complement: address.complement,
            neighborhood: address.neighborhood,
            city: address.city,
            state: address.state,
            zip_code: address.zip_code,
            full_text: `${address.street || ''}, ${address.number || ''} - ${address.neighborhood || ''}, ${address.city || ''} - ${address.state || ''}, ${address.zip_code || ''}`
        };

        const { data: newPt, error } = await supabase.from('patients').insert({
            organization_id: ORG_ID,
            name: p.nome_paciente,
            cpf: p.cpf ? String(p.cpf).replace(/\D/g, '') : null,
            email: p.email || null,
            phone: p.celular || p.telefone || null,
            birthdate: birth,
            gender: p.sexo === 'M' ? 'male' : p.sexo === 'F' ? 'female' : 'other',
            address: addressData,
            marketing_source: p.como_conheceu || null,
            occupation: p.profissao || null
        }).select('id').single();

        if (error) {
            console.error(`❌ Erro ao importar paciente ${p.nome_paciente}:`, error.message);
            // Already handled by error logging in previous runs, just link if existing
            const { data: existing } = await supabase.from('patients').select('id').eq('name', p.nome_paciente).limit(1).maybeSingle();
            if (existing) feegowToAxiomPt[String(p.id)] = existing.id;
        } else if (newPt) {
            feegowToAxiomPt[String(p.id)] = newPt.id;
        } else {
            console.error(`⚠️ Paciente ${p.nome_paciente} não retornou ID (Sucesso mas vazio?)`);
        }
    }

    // Tracker to avoid duplicate historical cards for the same day
    const detailedRecordDates = new Set(); // patientId_dateStr

    // 3. MIGRATE FORMS FIRST (More detail)
    console.log("- Importando Prontuários e Entregas...");
    for (const file of formsFiles) {
        const data = loadSheet(file);
        for (const f of data) {
            const patientId = feegowToAxiomPt[String(f.paciente_id)];
            if (!patientId) continue;

            const text = cleanHtml(f.conteudo_resumo);
            if (!text) continue;

            const dateRaw = f.data_hora || f.dhup;
            const dateIso = formatIso(dateRaw);
            const dateStr = dateIso?.split('T')[0];

            if (dateStr) detailedRecordDates.add(`${patientId}_${dateStr}`);

            const isDelivery = text.toLowerCase().includes('entrega') || text.toLowerCase().includes('ajuste');

            await supabase.from('patient_records').insert({
                organization_id: ORG_ID,
                patient_id: patientId,
                professional_id: AXIOM_PROF_MAP[String(f.profissionail_id)] || AXIOM_PROF_MAP["1"],
                template_id: BACKUP_TEMPLATE_ID,
                status: 'finalized',
                content: {
                    conteudo: text,
                    title: isDelivery ? (text.toLowerCase().includes('ajuste') ? '🔧 Ajuste de Palmilha (Feegow)' : '📦 Entrega de Palmilha (Feegow)') : 'Evolução Feegow',
                    _is_delivery: isDelivery,
                    _source_file: file
                },
                created_at: dateIso,
                updated_at: dateIso
            });
        }
    }

    // 4. MIGRATE AGENDA
    console.log("- Importando Agenda (Jan/Fev 2026 como compromissos, resto como histórico)...");
    const statusMap = {
        1: 'scheduled', 2: 'confirmed', 3: 'completed', 4: 'scheduled',
        5: 'scheduled', 6: 'canceled', 11: 'canceled', 208: 'confirmed'
    };

    for (const a of agTable) {
        const patientId = feegowToAxiomPt[String(a.paciente_id)];
        if (!patientId) continue;

        const dateStr = a.Data; // YYYY-MM-DD
        const isTargetRange = dateStr >= "2026-01-01" && dateStr <= "2026-02-28";
        const procName = procMap[String(a.procedimento_id)] || "Consulta";
        const serviceId = serviceMap[normalize(procName)];

        if (isTargetRange) {
            // Real Appointment
            const [h, m] = (a.Hora || "08:00").split(':').map(Number);
            const startStr = `${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00-03:00`;
            const dur = parseInt(a.tempo) || 45;
            const endD = new Date(new Date(startStr).getTime() + dur * 60000);

            await supabase.from('appointments').insert({
                organization_id: ORG_ID,
                patient_id: patientId,
                professional_id: AXIOM_PROF_MAP[String(a.profissional_id)] || AXIOM_PROF_MAP["1"],
                location_id: AXIOM_LOC_MAP[String(a.local_id)] || AXIOM_LOC_MAP["1"],
                status: statusMap[a.status_id] || 'scheduled',
                start_time: startStr,
                end_time: endD.toISOString(),
                service_id: serviceId,
                notes: `Importado Feegow | Procedimento: ${procName}`
            });
        } else {
            // ONLY Log agenda history if NO detailed form exists for this day
            if (detailedRecordDates.has(`${patientId}_${dateStr}`)) continue;

            // History Log (Patient Record)
            await supabase.from('patient_records').insert({
                organization_id: ORG_ID,
                patient_id: patientId,
                professional_id: AXIOM_PROF_MAP[String(a.profissional_id)] || AXIOM_PROF_MAP["1"],
                template_id: BACKUP_TEMPLATE_ID,
                status: 'finalized',
                content: {
                    conteudo: `Histórico de Agendamento Feegow\n\nData: ${dateStr} ${a.Hora}\nProcedimento: ${procName}\nStatus Original: ${a.status_nome || 'N/A'}`,
                    _type: 'agenda_history',
                    _date: dateStr
                },
                created_at: new Date(dateStr).toISOString(),
                updated_at: new Date(dateStr).toISOString()
            });
        }
    }

    // 5. BIOMECHANICS (Special Form)
    console.log("- Importando Avaliações Biomecânicas Estruturadas...");
    for (const b of biomechTable) {
        const patientId = feegowToAxiomPt[String(b.PacienteID || b.paciente_id)];
        if (!patientId) continue;

        let rawJson = {};
        try { rawJson = JSON.parse(b.campo || "{}"); } catch (e) { }

        const dateIso = formatIso(b.DataHora || b.dhup);

        // Basic mapping for V3 (from previous logic)
        const mapped = {
            anamnese: { queixa_principal: rawJson["QP"] || "Importado", hma: cleanHtml(rawJson["HMA"]), eva: parseInt(rawJson["EVA"]) || 0 },
            exame_fisico: {
                fpi: {
                    talus: { left: String(rawJson["Tálus E"] || 0), right: String(rawJson["Tálus D"] || 0) },
                    curvatura_maleolar: { left: String(rawJson["Maléolo E"] || 0), right: String(rawJson["Maléolo D"] || 0) },
                    posicao_calcaneo: { left: String(rawJson["Calcâneo E"] || 0), right: String(rawJson["Calcâneo D"] || 0) },
                    proeminencia_tln: { left: String(rawJson["Navicular E"] || 0), right: String(rawJson["Navicular D"] || 0) },
                    congruencia_arco: { left: String(rawJson["Arco E"] || 0), right: String(rawJson["Arco D"] || 0) },
                    abducao_antepé: { left: String(rawJson["Dedos E"] || 0), right: String(rawJson["Dedos D"] || 0) }
                }
            }
        };

        await supabase.from('patient_records').insert({
            organization_id: ORG_ID,
            patient_id: patientId,
            professional_id: AXIOM_PROF_MAP["1"],
            template_id: PALMILHA_V3_ID,
            status: 'finalized',
            content: { ...mapped, _imported: true, _original: rawJson },
            created_at: dateIso,
            updated_at: dateIso
        });
    }

    console.log("✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!");
}

migrate();
