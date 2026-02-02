
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

async function inspectAppointment() {
    const apptId = '9cc2efcd-2f36-4378-9339-5eb65bf86aa1';

    console.log(`Inspecting Appointment: ${apptId}`);

    // 1. Get Appointment
    const { data: appt, error: apptError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', apptId)
        .single();

    if (apptError) {
        console.error("Appointment Error:", apptError);
        return;
    }

    console.log("Appointment Found:", {
        id: appt.id,
        patient_id: appt.patient_id,
        professional_id: appt.professional_id,
        organization_id: appt.organization_id,
        start_time: appt.start_time
    });

    // 2. Check Patient
    if (appt.patient_id) {
        const { data: patient, error: patientError } = await supabase
            .from('patients')
            .select('id, name, organization_id')
            .eq('id', appt.patient_id)
            .single();

        if (patientError) console.error("Patient Error:", patientError);
        else console.log("Patient Found:", patient);
    } else {
        console.log("No patient_id in appointment");
    }

    // 3. Check Professional
    if (appt.professional_id) {
        const { data: professional, error: profError } = await supabase
            .from('profiles')
            .select('id, full_name, organization_id')
            .eq('id', appt.professional_id)
            .single();

        if (profError) console.error("Professional Error:", profError);
        else console.log("Professional Found:", professional);
    } else {
        console.log("No professional_id in appointment");
    }

    // Fix Plan: If misaligned orgs, align to '9571532e-fdf8-4aaa-b236-416fd6459566' (Access Fisioterapia)
    const targetOrg = '9571532e-fdf8-4aaa-b236-416fd6459566';

    if (appt.organization_id !== targetOrg) {
        console.log(`Mismatch! Appointment Org (${appt.organization_id}) != Target (${targetOrg}). Fixing...`);
        await supabase.from('appointments').update({ organization_id: targetOrg }).eq('id', apptId);
    }
}

inspectAppointment();
