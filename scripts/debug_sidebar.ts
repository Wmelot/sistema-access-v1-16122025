
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const envConfig = dotenv.parse(fs.readFileSync(path.resolve(process.cwd(), '.env.local')));
for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function debugSidebar() {
    console.log("=== CHECKING 'TEST-CLINIC' ===");
    const SLUG = 'test-clinic';

    const { data: org } = await supabase.from('organizations').select('*').eq('slug', SLUG).single();

    if (!org) {
        console.error("Test Clinic not found!");
        return;
    }

    console.log("Org Data in DB:", org);

    // Check Settings
    const { data: settings } = await supabase.from('clinic_settings').select('*').eq('id', org.id).single();
    console.log("Linked Clinic Settings:", settings);

    // Check Fallback logic possibility
    const { data: fallback } = await supabase.from('clinic_settings').select('*').limit(1).single();
    console.log("Legacy Fallback Settings (First Row):", fallback);
}

debugSidebar();
