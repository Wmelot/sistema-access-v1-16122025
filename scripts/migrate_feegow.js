const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const SUPABASE_URL = "https://robptuukezhqvtasjyhz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYnB0dXVrZXpocXZ0YXNqeWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ4NjcwMCwiZXhwIjoyMDgzMDYyNzAwfQ.hufdKEjY0XFSIYvrv7FrNyb2aX49JORBulplO19d0u4";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const base_path = "/Users/wmelo/Axiom/clinic30490_backup_excel/";

async function migrate() {
    console.log("Iniciando migração de teste...");

    // 1. Get Organization
    const { data: orgs } = await supabase.from('organizations').select('id').eq('slug', 'access-fisioterapia');
    if (!orgs || orgs.length === 0) {
        console.error("Organização não encontrada");
        return;
    }
    const orgId = orgs[0].id;
    console.log("Org ID:", orgId);

    // 2. Load Professionals for mapping
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').eq('organization_id', orgId);
    const profMap = {};
    profiles.forEach(p => profMap[p.full_name.toLowerCase()] = p.id);
    // Warley de Melo Oliveira usually
    console.log("Profissionais mapeados:", Object.keys(profMap).length);

    // 3. Load Patients from Excel
    const ptsFile = xlsx.readFile(path.join(base_path, "pacientes.xlsx"));
    const ptsData = xlsx.utils.sheet_to_json(ptsFile.Sheets[ptsFile.SheetNames[0]]);
    const targetNames = ["Adaliana Bastos dos Santos Rodrigues", "Adriana Paula da Cruz Barreto"];
    const targetPts = ptsData.filter(p => targetNames.includes(p.nome_paciente));

    for (const p of targetPts) {
        console.log(`\nProcessando paciente: ${p.nome_paciente}`);

        // 3.1 Create/Update Patient in Axiom
        let { data: axiomPt } = await supabase.from('patients').select('id').eq('name', p.nome_paciente).single();
        if (!axiomPt) {
            console.log("Criando paciente no Axiom...");
            const { data: newPt, error: ptErr } = await supabase.from('patients').insert({
                organization_id: orgId,
                name: p.nome_paciente,
                cpf: p.cpf ? String(p.cpf) : null,
                phone: p.celular ? String(p.celular) : null,
                email: p.email || null,
                birthdate: p.nascimento || null,
                gender: p.sexo === 'F' ? 'female' : 'male',
                notes: p.Observacoes || ""
            }).select().single();
            if (ptErr) { console.error("Erro ao criar paciente:", ptErr); continue; }
            axiomPt = newPt;
        }
        const patientId = axiomPt.id;

        // 3.2 Migrar Evoluções (atendimentos.xlsx)
        const attFile = xlsx.readFile(path.join(base_path, "atendimentos.xlsx"));
        const attData = xlsx.utils.sheet_to_json(attFile.Sheets[attFile.SheetNames[0]]);
        const pAtts = attData.filter(a => a.paciente_id === p.id);

        console.log(`Migrando ${pAtts.length} evoluções...`);
        for (const att of pAtts) {
            const date = att.DATA || att.dhup;
            const content = {
                text: att.Obs || "Atendimento migrado do Feegow",
                _record_type: 'evolution'
            };

            // Check if record exists
            const { data: existing } = await supabase.from('patient_records')
                .select('id').eq('patient_id', patientId).eq('created_at', date).maybeSingle();

            if (!existing) {
                await supabase.from('patient_records').insert({
                    organization_id: orgId,
                    patient_id: patientId,
                    content: content,
                    created_at: date,
                    updated_at: date,
                    professional_id: profiles[0].id // Fallback to first profile or map if available
                });
            }
        }

        // 3.3 Migrar Formulário Biomecânica (form_tabela_12.xlsx)
        const f12File = xlsx.readFile(path.join(base_path, "form_tabela_12.xlsx"));
        const f12Data = xlsx.utils.sheet_to_json(f12File.Sheets[f12File.SheetNames[0]]);
        const pForms = f12Data.filter(f => f.NomePaciente === p.nome_paciente);

        console.log(`Migrando ${pForms.length} formulários de palmilha...`);
        for (const f of pForms) {
            try {
                const rawData = JSON.parse(f.campo || "{}");
                const content = {
                    biomechanics: rawData,
                    _record_type: 'assessment',
                    _template_name: 'Consulta Palmilha (Feegow)'
                };

                await supabase.from('patient_records').insert({
                    organization_id: orgId,
                    patient_id: patientId,
                    content: content,
                    created_at: f.DataHora,
                    updated_at: f.DataHora,
                    professional_id: profiles[0].id
                });
            } catch (e) {
                console.error("Erro ao processar campo JSON:", e);
            }
        }
    }

    // 4. Sincronizar Agenda Jan 19-23
    console.log("\nSincronizando agenda de 19 a 23 de Janeiro...");
    const agFile = xlsx.readFile(path.join(base_path, "agendamentos.xlsx"));
    const agData = xlsx.utils.sheet_to_json(agFile.Sheets[agFile.SheetNames[0]]);

    // Status Map (Axiom format)
    const statusMap = {
        1: 'scheduled', 2: 'attended', 3: 'attended', 4: 'scheduled',
        5: 'scheduled', 6: 'no_show', 7: 'scheduled', 11: 'cancelled',
        15: 'scheduled', 22: 'cancelled', 208: 'attended'
    };

    const weekStart = new Date("2026-01-19T00:00:00");
    const weekEnd = new Date("2026-01-23T23:59:59");

    const filteredAg = agData.filter(a => {
        const d = new Date(a.Data);
        return d >= weekStart && d <= weekEnd;
    });

    console.log(`Found ${filteredAg.length} appointments in Feegow.`);
    // Many will fail if patients don't exist, but we migrate what we can
    // In a real scenario we'd migrate all patients first
}

migrate();
