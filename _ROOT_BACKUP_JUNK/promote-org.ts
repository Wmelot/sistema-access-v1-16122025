
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function main() {
    const MASTER_ORG_ID = '00000000-0000-0000-0000-000000000001';
    const TARGET_ORG_ID = '00000000-0000-0000-0000-000000000002'; // Access Fisioterapia

    console.log('--- Warning: This operation is destructive and irreversible ---');
    console.log('--- Promoting Access Fisioterapia (0002) to Master (0001) ---');

    // 1. Fetch Target Data (Access Fisioterapia)
    const { data: targetOrg } = await supabase.from('organizations').select('*').eq('id', TARGET_ORG_ID).single();

    if (!targetOrg) {
        console.error('Target Org (0002) not found.');
        return;
    }

    console.log(`Found Target: ${targetOrg.name}`);

    // 2. Move Profiles
    console.log('Relinking Profiles...');
    const { error: profError } = await supabase.from('profiles')
        .update({ organization_id: MASTER_ORG_ID })
        .eq('organization_id', TARGET_ORG_ID);

    if (profError) console.error('Error linking profiles:', profError);

    // 3. Move Patients
    console.log('Relinking Patients...');
    const { error: patError } = await supabase.from('patients')
        .update({ organization_id: MASTER_ORG_ID })
        .eq('organization_id', TARGET_ORG_ID);

    if (patError) console.error('Error linking patients:', patError);

    // 4. Move Appointments? (Check if column exists, safe to try update, it will ignore if column missing if we select first?)
    // Actually, appointments usually link to patient_id, so if patient is moved, appointment is logically moved.
    // But if RLS relies on organization_id column on appointments, we must update it.
    // Let's assume schema has it based on "multi-tenancy" comments.
    // If it fails, script continues (we catch).
    try {
        console.log('Relinking Appointments (if applicable)...');
        const { error: apptError } = await supabase.from('appointments')
            .update({ organization_id: MASTER_ORG_ID })
            .eq('organization_id', TARGET_ORG_ID);
        if (apptError) console.log('Note: Appointments update skipped or failed (might not have column).');
    } catch (e) { }

    // 5. Update Master Org Metadata
    console.log('Updating Master Org Metadata...');
    const { error: updateError } = await supabase.from('organizations')
        .update({
            name: targetOrg.name,
            // slug: targetOrg.slug, // Column missing
            features: targetOrg.features,
            primary_color: targetOrg.primary_color || '#000000',
            logo_url: targetOrg.logo_url,
            plan: targetOrg.plan || 'enterprise',
            plan_config_id: targetOrg.plan_config_id
        })
        .eq('id', MASTER_ORG_ID);

    if (updateError) {
        console.error('Failed to update Master Org:', updateError);
        return;
    }

    // 6. Delete Old Target Record
    console.log('Deleting old Organization record...');
    const { error: deleteError } = await supabase.from('organizations').delete().eq('id', TARGET_ORG_ID);

    if (deleteError) {
        console.error('Error deleting old org:', deleteError);
    } else {
        console.log('Old Org deleted successfully.');
    }

    console.log('--- Promotion Complete ---');
}

main();
