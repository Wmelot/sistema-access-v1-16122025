
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Use SERVICE_ROLE_KEY to bypass RLS and see everything
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function findData() {
    console.log('--- SEARCHING PRODUCTS ---');
    const { data: products, error: prodError } = await supabase
        .from('products')
        .select('*');

    if (prodError) console.error('Error fetching products:', prodError.message);
    else {
        console.log(`Found ${products.length} products:`);
        products.forEach(p => console.log(` - ${p.name} (Active: ${p.active})`));
    }

    console.log('\n--- SEARCHING SERVICES (If exists) ---');
    // Check if 'services' table exists by trying to select
    const { data: services, error: servError } = await supabase
        .from('services')
        .select('*');

    if (servError) {
        console.log('Services table not accessible (or does not exist):', servError.message);
    } else {
        console.log(`Found ${services.length} services:`);
        services.forEach(s => console.log(` - ${s.name || s.title}`));
    }
}

findData();
