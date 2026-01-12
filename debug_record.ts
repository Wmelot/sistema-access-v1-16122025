
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function main() {
    // 1. Load Env
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach((line: string) => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const val = parts.slice(1).join('=').trim().replace(/"/g, ''); // strip quotes
                process.env[key] = val;
            }
        });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        console.error("Could not load SUPABASE_URL or SERVICE_ROLE_KEY from .env.local");
        process.exit(1);
    }

    const supabase = createClient(url, key);
    const id = 'e98bd807-fd15-42ac-9124-c18721e94c07';

    console.log(`Checking Record ID: ${id}`);

    // Check patient_records
    const { data: record, error } = await supabase
        .from('patient_records')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error("Error fetching from patient_records:", error);
    } else {
        console.log("SUCCESS: Record found in patient_records.");

        const content = record.content || {};
        console.log("Content Keys:", Object.keys(content));

        // Check Critical Sections
        const checkSection = (name) => {
            const data = content[name];
            const status = data ? (Object.keys(data).length > 0 ? "✅ Present" : "⚠️ Empty Object") : "❌ Missing";
            console.log(`- ${name}: ${status}`);
            if (data) console.log(`  Preview:`, JSON.stringify(data).substring(0, 100) + "...");
        };

        checkSection('efep');
        checkSection('patientProfile');
        checkSection('painPoints');
        checkSection('anthropometry');
        checkSection('measurements');

        // Full Dump for safety
        console.log("\n--- FULL CONTENT DUMP ---");
        console.log(JSON.stringify(content, null, 2));
    }
}

main().catch(console.error);
