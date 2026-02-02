

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
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);



async function inspectTable(tableName: string) {
    console.log(`Inspecting ${tableName}...`);
    // Select features explicitly to check existence
    const { data, error } = await supabase.from(tableName).select('features, id').limit(1);
    if (error) {
        console.error(`Error inspecting ${tableName}:`, error);
    } else {
        console.log(`${tableName} data:`, data);
    }
}


async function run() {
    await inspectTable('organizations');
    await inspectTable('clinic_settings');
}

run();
