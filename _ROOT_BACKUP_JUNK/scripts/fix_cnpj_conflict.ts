
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env.local
const envConfig = dotenv.parse(fs.readFileSync(path.resolve(process.cwd(), '.env.local')));
for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Must use service role
const supabase = createClient(supabaseUrl, supabaseKey);

const CNPJ_TO_CHECK = '36.060.409/0001-40';
const TARGET_SLUG = 'access-fisioterapia';

async function fixCnpjConflict() {
    console.log(`--- Fixing CNPJ Conflict for ${CNPJ_TO_CHECK} ---`);

    // 1. Get the Valid Organization ID
    const { data: validOrg, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .eq('slug', TARGET_SLUG)
        .single();

    if (orgError || !validOrg) {
        console.error('Could not find the valid organization (Access Fisioterapia). Aborting.');
        return;
    }

    console.log(`Valid Organization: ${validOrg.name} (ID: ${validOrg.id})`);

    // 2. Find conflicting records in clinic_settings
    const { data: conflicts, error: conflictError } = await supabase
        .from('clinic_settings')
        .select('id, name')
        .eq('cnpj', CNPJ_TO_CHECK);

    if (conflictError) {
        console.error('Error searching for conflicts:', conflictError);
        return;
    }

    if (!conflicts || conflicts.length === 0) {
        console.log('No conflicts found. The CNPJ is free.');
        return;
    }

    console.log(`Found ${conflicts.length} conflicting records.`);

    for (const conflict of conflicts) {
        if (conflict.id === validOrg.id) {
            console.log(`- Record ${conflict.id} is the VALID one. Keeping it.`);
        } else {
            console.log(`- Record ${conflict.id} is a ZOMBIE/Duplicate. Deleting...`);

            const { error: delError } = await supabase
                .from('clinic_settings')
                .delete()
                .eq('id', conflict.id);

            if (delError) {
                console.error(`  > Failed to delete: ${delError.message}`);
            } else {
                console.log(`  > Deleted successfully.`);
            }
        }
    }
}

fixCnpjConflict();
