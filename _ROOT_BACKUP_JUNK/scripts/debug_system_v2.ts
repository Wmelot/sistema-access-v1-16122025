
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const envConfig = dotenv.parse(fs.readFileSync(path.resolve(process.cwd(), '.env.local')));
for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function debugSystem() {
    console.log("=== 1. CNPJ DEBUG ===");
    const cnpj = '36.060.409/0001-40';
    const { data: settingsByCnpj } = await supabase.from('clinic_settings').select('id, name, cnpj').eq('cnpj', cnpj);
    console.log(`Rotas com CNPJ ${cnpj}:`, settingsByCnpj);

    // Check organizations linked
    if (settingsByCnpj) {
        for (const s of settingsByCnpj) {
            const { data: org } = await supabase.from('organizations').select('id, name, slug').eq('id', s.id).single();
            console.log(`  -> ID ${s.id} linkado a Org:`, org ? `${org.name} (${org.slug})` : 'NENHUMA (Zumbi)');
        }
    }

    console.log("\n=== 2. ACCESS FISIOTERAPIA ORG ===");
    const { data: accessOrg } = await supabase.from('organizations').select('id, name, slug').eq('slug', 'access-fisioterapia').single();
    if (!accessOrg) {
        console.log("CRITICAL: Access Fisioterapia org not found by slug 'access-fisioterapia'");
    } else {
        console.log("Org Info:", accessOrg);

        console.log("\n=== 3. MISSING PROFESSIONALS Search ===");
        const names = ['Felipe', 'Fábio', 'Rayane', 'Leticia']; // Added Leticia generally
        const { data: pros } = await supabase.from('professionals').select('id, name, organization_id').or(`name.ilike.%Felipe%,name.ilike.%Fábio%,name.ilike.%Rayane%`);
        console.log("Found Professionals:", pros);

        if (pros) {
            pros.forEach(p => {
                if (p.organization_id !== accessOrg.id) {
                    console.log(`  -> WARNING: ${p.name} has Org ID ${p.organization_id}, expected ${accessOrg.id}`);
                } else {
                    console.log(`  -> OK: ${p.name} is correctly linked.`);
                }
            });
        }
    }
}

debugSystem();
