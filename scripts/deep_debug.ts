
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const envConfig = dotenv.parse(fs.readFileSync(path.resolve(process.cwd(), '.env.local')));
for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function deepDebug() {
    console.log("=== 1. SEARCHING 'MISSING' USERS ===");
    const searchNames = ['Felipe', 'Fábio', 'Rayane'];

    // Check Profiles
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, email, organization_id');
    const matchedProfiles = profiles?.filter(p => searchNames.some(name => p.full_name?.includes(name)));
    console.log("Matched Profiles:", matchedProfiles);

    if (matchedProfiles && matchedProfiles.length > 0) {
        // Check what org they belong to
        for (const p of matchedProfiles) {
            const { data: org } = await supabase.from('organizations').select('name, slug').eq('id', p.organization_id || '').single();
            console.log(`  -> ${p.full_name} belongs to Org: ${org?.name || 'NULL'} (ID: ${p.organization_id})`);
        }
    }

    console.log("\n=== 2. CHECKING 'TESTE-CLINIC-2' ===");
    const { data: testeOrg, error: testeErr } = await supabase.from('organizations').select('id, name, slug').eq('slug', 'teste-clinic-2').single();
    if (testeErr) {
        console.log("Error finding teste-clinic-2:", testeErr.message);
    } else {
        console.log("Found teste-clinic-2:", testeOrg);
    }

    console.log("\n=== 3. CHECKING 'ACCESS-FISIOTERAPIA' ===");
    const { data: accessOrg } = await supabase.from('organizations').select('id, name, slug').eq('slug', 'access-fisioterapia').single();
    console.log("Access Org:", accessOrg);
}

deepDebug();
