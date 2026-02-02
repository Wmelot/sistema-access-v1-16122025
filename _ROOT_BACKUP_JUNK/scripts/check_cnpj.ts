
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
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Must use service role to see all
const supabase = createClient(supabaseUrl, supabaseKey);

const CNPJ_TO_CHECK = '36.060.409/0001-40';

async function checkCnpj() {
    console.log(`Checking owner of CNPJ: ${CNPJ_TO_CHECK}`);

    // 1. Find in clinic_settings
    const { data: settings, error } = await supabase
        .from('clinic_settings')
        .select('id, name, created_at')
        .eq('cnpj', CNPJ_TO_CHECK);

    if (error) {
        console.error('Error fetching settings:', error);
        return;
    }

    if (!settings || settings.length === 0) {
        console.log('No organization found with this CNPJ.');
        return;
    }

    console.log(`Found ${settings.length} records with this CNPJ.`);

    for (const setting of settings) {
        // The 'id' in clinic_settings matches 'organization_id' in organizations (per our recent refactor logic)
        // Let's verify the organization details
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('id, name, slug')
            .eq('id', setting.id)
            .single();

        if (orgError) {
            console.log(`- Settings ID: ${setting.id} (Name in Settings: ${setting.name}) -> Could not find linked Organization (Error: ${orgError.message})`);
        } else {
            console.log(`- Settings ID: ${setting.id} (Name in Settings: ${setting.name}) -> Linked Org: ${org.name} (Slug: ${org.slug})`);
        }
    }
}

checkCnpj();
