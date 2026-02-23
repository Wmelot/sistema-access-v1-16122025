require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function enableMap() {
    console.log("Adding Radar Route...");
    const { data: route } = await supabase
        .from('module_routes')
        .select('*')
        .eq('path', '/radar-propulsao')
        .single();

    if (!route) {
        const res = await supabase.from('module_routes').insert({
            module_id: '1a57ca50-e14b-4b2e-a5ba-3f3ae9eed1a6', // Must be Dashboard UUID or fetched dynamically. Let me fetch it.
        });
    }
}

async function safeEnable() {
    // 1. fetch a valid module or create a new "Radar Propulsao" feature flag if needed
    // The user's sidebar handles routes dynamically by "module_routes".
    // I will just insert it safely:
    const { data: route } = await supabase.from('module_routes').select().eq('path', '/radar-propulsao').single();
    if (!route) {
        // Let's get any active module id that exists in the current DB to tie it!
        const { data: mod } = await supabase.from('modules').select('id').eq('is_active', true).limit(1).single();
        if (mod) {
            await supabase.from('module_routes').insert({
                module_id: mod.id,
                name: 'Radar Propulsão',
                path: '/radar-propulsao',
                icon: 'map-pin',
                is_active: true,
                position: 10
            })
            console.log("Radar module route added under module ID:", mod.id);
        } else {
            console.log("No active module found to tie this route to");
        }
    } else {
        console.log("Route already exists");
    }
}
safeEnable();
