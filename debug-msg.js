const { Client } = require('pg');
const crypto = require('crypto');

const conn = 'postgresql://postgres:0xw8SnQc09fHn7S4@db.robptuukezhqvtasjyhz.supabase.co:5432/postgres';
const REGION_QUESTIONNAIRE_MAP = {
    'Lombar': ['34ab93ca-2666-469c-afbe-e95778b7cdd5', '99c01065-3958-488d-9d55-423e9183b2d8'],
    'Cervical': ['b3315150-daeb-47fb-a5b3-d2a398e61f05'],
    // ... others
};

async function run() {
    const client = new Client({ connectionString: conn });
    await client.connect();

    try {
        console.log("--- DEBUGGING MESSAGE GENERATION ---");

        // 1. Get the patient (Teste)
        const patRes = await client.query("SELECT id, name, phone FROM patients WHERE name ILIKE '%Paciente teste%' LIMIT 1");
        const patient = patRes.rows[0];
        if (!patient) throw new Error("Patient not found");
        console.log("Patient:", patient.name);

        // 2. Get the last appointment
        const apptRes = await client.query("SELECT * FROM appointments WHERE patient_id = $1 ORDER BY start_time DESC LIMIT 1", [patient.id]);
        const appt = apptRes.rows[0];
        if (!appt) throw new Error("Appointment not found");
        console.log("Appointment ID:", appt.id);
        console.log("Notes:", appt.notes);

        // 3. Get the template
        const tmplRes = await client.query("SELECT * FROM message_templates WHERE trigger_type = 'questionnaire_12h' AND is_active = true LIMIT 1");
        const template = tmplRes.rows[0];
        console.log("Template Found:", !!template);
        console.log("Template Content:", template.content);

        // 4. Simulate Logic
        let messageText = template.content;

        // Detect Regions
        const notes = (appt.notes || "").toLowerCase();
        const detectedRegions = [];
        for (const region of Object.keys(REGION_QUESTIONNAIRE_MAP)) {
            if (notes.includes(region.toLowerCase().trim())) {
                detectedRegions.push(region);
            }
        }
        console.log("Detected Regions:", detectedRegions);

        let questionnaireLinks = "";

        // FALIBACK LOGIC SIMULATION
        if (detectedRegions.length === 0) {
            console.log("Fallback Triggered");
            const generalId = 'd4c4a6c0-7b2a-4b6e-9c2b-8e1d7f6a5b4c';

            // Try to Insert Follow Up
            const token = crypto.randomBytes(16).toString('hex');
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            console.log("Attempting Insert with:");
            console.log({
                patient_id: appt.patient_id,
                template_id: generalId,
                organization_id: appt.organization_id,
                status: 'pending',
                token: token,
                scheduled_date: new Date().toISOString()
            });

            try {
                const insertRes = await client.query(`
                    INSERT INTO assessment_follow_ups 
                    (patient_id, template_id, organization_id, status, token, scheduled_date, delivery_date)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING id
                `, [appt.patient_id, generalId, appt.organization_id, 'pending', token, new Date().toISOString(), new Date().toISOString().split('T')[0]]);

                console.log("Insert Success! ID:", insertRes.rows[0].id);
                questionnaireLinks = `\n(Avaliação Geral): https://axiom-production.vercel.app/c/${token.substring(0, 6)}`;

            } catch (err) {
                console.error("INSERT FAILED:", err.message);
                console.error("Detail:", err);
            }
        }

        // Replace
        if (template.content.includes('{{links_questionarios}}')) {
            messageText = messageText.replace(/{{links_questionarios}}/g, questionnaireLinks);
        }

        console.log("\n--- FINAL MESSAGE ---\n");
        console.log(messageText);

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
