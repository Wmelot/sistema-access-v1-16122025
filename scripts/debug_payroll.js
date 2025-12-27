
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function main() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("Missing env vars");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Checking payment_methods columns...");
    const { data: pm, error: pmError } = await supabase.from('payment_methods').select('*').limit(1);
    if (pmError) console.error("PM Error:", pmError);
    else console.log("PM Keys:", Object.keys(pm[0] || {}));

    console.log("Checking payment_method_fees columns...");
    const { data: fees, error: feesError } = await supabase.from('payment_method_fees').select('*').limit(1);
    if (feesError) console.error("Fees Error:", feesError);
    else {
        console.log("Fees Keys:", Object.keys(fees[0] || {}));
        console.log("Fees Sample:", fees[0]);
    }

    console.log("Testing getProfessionalStatement query...");
    // Mock params
    const professionalId = 'some-uuid'; // We might not have a valid one, but we just want to see if the Select syntax is valid

    // Using the exact query structure from actions.ts
    const query = supabase
        .from('commissions')
        .select(`
            *,
            appointment:appointments(
                date,
                start_time,
                end_time,
                status,
                price,
                service:services(name),
                patient:patients(name),
                payment_method:payment_methods(slug, name)
            )
        `)
        .limit(1);

    const { data, error } = await query;
    if (error) {
        console.error("Query Error:", error);
    } else {
        console.log("Query Success. Data:", !!data);
    }
}

main();
