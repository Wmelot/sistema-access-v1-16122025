
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Check if we need Service Role?
// Anonymous key usually has RLS. User is logged in Frontend. Here we are Script.
// We might need SERVICE_ROLE_KEY to bypass RLS for testing?
// Or we need to Simulate User Login?
// Let's try Service Role Key if available.
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;

const supabase = createClient(supabaseUrl, serviceKey);

async function testPersistence() {
    console.log('Testing Database Persistence...');
    const id = 'fde183ad-1c20-4d6c-9efb-89d08f483cf2'; // User's URL ID

    // 1. Read Current
    const { data: initial, error: readErr } = await supabase
        .from('form_templates')
        .select('fields')
        .eq('id', id)
        .single();

    if (readErr) {
        console.error('Read Error:', readErr);
        return;
    }
    console.log('Current Fields Count:', initial.fields?.length);
    if (initial.fields?.length > 0) {
        const p1 = initial.fields.find((f: any) => f.type === 'pain_map');
        console.log('Pain Map P1 (Initial):', p1?.points?.[0]);
    }

    // 2. Modify (Add a Marker Description)
    const newFields = JSON.parse(JSON.stringify(initial.fields));
    const painMap = newFields.find((f: any) => f.type === 'pain_map');
    if (painMap && painMap.points && painMap.points[0]) {
        painMap.points[0].x = 55.5; // Force Test Value
        painMap.points[0].y = 55.5;
        console.log('Setting P1 to 55.5, 55.5...');
    }

    // 3. Update
    const { error: updateErr } = await supabase
        .from('form_templates')
        .update({ fields: newFields })
        .eq('id', id);

    if (updateErr) {
        console.error('Update Error:', updateErr);
        return;
    }
    console.log('Update Success.');

    // 4. Read Again
    const { data: final, error: readErr2 } = await supabase
        .from('form_templates')
        .select('fields')
        .eq('id', id)
        .single();

    if (readErr2) {
        console.error('Read 2 Error:', readErr2);
        return;
    }

    const p1final = final.fields.find((f: any) => f.type === 'pain_map');
    console.log('Pain Map P1 (Final):', p1final?.points?.[0]);

    if (p1final?.points?.[0]?.x === 55.5) {
        console.log('✅ PERSISTENCE WORKING via Script.');
    } else {
        console.log('❌ PERSISTENCE FAILED via Script.');
    }
}

testPersistence();
