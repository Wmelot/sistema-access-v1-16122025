
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, ''); // Remove quotes
        }
    });
}

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables. Make sure .env.local exists and has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function cleanupTenants() {
    console.log('Starting cleanup of test tenants...');

    const targets = ['Minha Clínica', 'Axiom Central'];

    for (const name of targets) {
        console.log(`Searching for: ${name}`);
        const { data: orgs, error } = await supabase
            .from('organizations')
            .select('id, name')
            .eq('name', name);

        if (error) {
            console.error(`Error searching for ${name}:`, error);
            continue;
        }

        if (orgs && orgs.length > 0) {
            for (const org of orgs) {
                console.log(`Deleting ${org.name} (ID: ${org.id})...`);

                // Delete related data first if no cascade (assuming cascade setup, but safe to try delete org directly)
                // Usually organizations delete cascades to profiles, etc.
                const { error: deleteError } = await supabase
                    .from('organizations')
                    .delete()
                    .eq('id', org.id);

                if (deleteError) {
                    console.error(`Failed to delete ${org.id}:`, deleteError);
                } else {
                    console.log(`Successfully deleted ${org.id}`);
                }
            }
        } else {
            console.log(`No organization found with name: ${name}`);
        }
    }

    console.log('Cleanup complete.');
}

cleanupTenants();
