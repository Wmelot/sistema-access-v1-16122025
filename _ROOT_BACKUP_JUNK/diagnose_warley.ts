
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseWarley() {
    const warleyId = '839a77d3-a7f0-4103-bc4a-004ec550bd15';
    console.log(`Diagnosing User: ${warleyId}`);

    // 1. Check Profile & Org
    const { data: profile, error: pErr } = await supabase.from('profiles').select('*').eq('id', warleyId).single();
    if (pErr) console.error("Profile Error:", pErr);

    if (!profile) {
        console.log("Profile not found.");
        return;
    }

    console.log(`Profile Name: ${profile.full_name}`);
    console.log(`Current Organization ID: ${profile.organization_id}`);

    // 2. Count Appointments in his current Org
    const { count: apptsInOrg } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id);
    console.log(`Appointments in Org (${profile.organization_id}): ${apptsInOrg}`);

    // 3. Find where his appointments actually are (by professional_id)
    // We want to see if he has appointments linked to OTHER organizations
    const { data: warleyAppts } = await supabase
        .from('appointments')
        .select('organization_id, count(*)')
        .eq('professional_id', warleyId)
    //.rpc('count_by_org') // No simple group by in client usually, let's fetch raw

    // Manual Grouping
    const { data: allHisAppts } = await supabase
        .from('appointments')
        .select('id, organization_id')
        .eq('professional_id', warleyId);

    if (allHisAppts && allHisAppts.length > 0) {
        const orgCounts: Record<string, number> = {};
        allHisAppts.forEach(a => {
            const org = a.organization_id || 'null';
            orgCounts[org] = (orgCounts[org] || 0) + 1;
        });
        console.log("Warley's Appointments are located in these Organizations:", orgCounts);

        // Check details of the "Other" organization if exists
        const orgIds = Object.keys(orgCounts).filter(id => id !== profile.organization_id && id !== 'null');
        if (orgIds.length > 0) {
            const { data: otherOrgs } = await supabase.from('organizations' as any).select('*').in('id', orgIds); // Assuming table exists or we check via something else
            console.log("Potential correct organization IDs:", orgIds);
        }
    } else {
        console.log("Warley has NO appointments as a professional anywhere.");
    }
}

diagnoseWarley();
