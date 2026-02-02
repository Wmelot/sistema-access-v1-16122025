
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const envConfig = dotenv.parse(fs.readFileSync(path.resolve(process.cwd(), '.env.local')));
for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const ACCESS_ORG_ID = '9571532e-fdf8-4aaa-b236-416fd6459566';
const MASTER_ORG_ID = '00000000-0000-0000-0000-000000000001';

async function migrateUsers() {
    console.log("=== MOVING USERS TO ACCESS FISIOTERAPIA ===");

    // Users to move from Master (or anywhere) to Access
    const targetEmails = [
        'fabio.de.oliveira.cardoso.1768523724567@migration.axiom.local', // Fábio
        'rayane.vilela.pereira.1768523466497@migration.axiom.local' // Rayane
    ];

    for (const email of targetEmails) {
        console.log(`Migrating: ${email}...`);
        const { error } = await supabase
            .from('profiles')
            .update({ organization_id: ACCESS_ORG_ID })
            .eq('email', email);

        if (error) {
            console.error(`  -> Failed: ${error.message}`);
        } else {
            console.log(`  -> Success! Moved to Org ID ${ACCESS_ORG_ID}`);
        }
    }
}

async function fixGhostUser() {
    console.log("\n=== FIXING GHOST USER IN TESTE-CLINIC-2 ===");
    // You said "FOTO 2, estava em outra clínica que eu eu não tenho relação e eu continuo aparecendo..."
    // This usually happens if the active user (YOU) is somehow linked to that clinic OR the list is fetching ALL users.

    // Let's check who 'teste-clinic-2' has.
    const TESTE_CLINIC_2_ID = '626f9e6d-fa34-4ddf-960b-b97d832dee84';

    const { data: usersInClinic2 } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('organization_id', TESTE_CLINIC_2_ID);

    console.log("Users currently in Teste Clinic 2:", usersInClinic2);

    // If you (Warley) are there, we remove you.
    // Assuming your email is wmelot@gmail.com
    const { data: myProfile } = await supabase.from('profiles').select('id, organization_id').eq('email', 'wmelot@gmail.com').single();

    if (myProfile?.organization_id === TESTE_CLINIC_2_ID) {
        console.log("CRITICAL: You are linked to Teste Clinic 2! Moving you back to Access.");
        await supabase.from('profiles').update({ organization_id: ACCESS_ORG_ID }).eq('id', myProfile.id);
    } else {
        console.log(`You are currently in Org: ${myProfile?.organization_id} (Should be ${ACCESS_ORG_ID})`);
    }
}

async function run() {
    await migrateUsers();
    await fixGhostUser();
}

run();
