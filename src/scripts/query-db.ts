import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
    const rawArg = process.argv[2];

    // Check if it's a UUID (direct id lookup)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (rawArg && uuidRegex.test(process.argv[3] || "")) {
        const table = rawArg;
        const id = process.argv[3];
        const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
        if (error) console.error("Error:", error);
        else console.log("Data:", JSON.stringify(data, null, 2));
    } else if (rawArg && rawArg.toLowerCase().startsWith('select')) {
        // [IMPORTANT] We don't have execute_sql_query RPC, so we try to parse table name and do from().select()
        const fromMatch = rawArg.match(/from\s+([a-z0-9_]+)/i);
        const whereMatch = rawArg.match(/where\s+(.+?)(\s+limit|\s+order|$)/i);

        if (fromMatch) {
            const table = fromMatch[1];
            let q = supabase.from(table).select('*');

            // Very basic where clause parsing
            if (whereMatch) {
                const where = whereMatch[1];
                if (where.includes('ILIKE')) {
                    const parts = where.split(/ILIKE/i);
                    const col = parts[0].trim();
                    const val = parts[1].trim().replace(/'/g, '').replace(/%/g, '');
                    q = q.ilike(col, `%${val}%`);
                } else if (where.includes('=')) {
                    const parts = where.split('=');
                    const col = parts[0].trim();
                    const val = parts[1].trim().replace(/'/g, '');
                    q = q.eq(col, val);
                }
            }

            const limitMatch = rawArg.match(/limit\s+(\d+)/i);
            if (limitMatch) q = q.limit(parseInt(limitMatch[1]));
            else q = q.limit(20);

            const { data, error } = await q;
            if (error) console.error("Error:", error);
            else console.log("Results:", JSON.stringify(data, null, 2));
        }
    } else {
        console.log("Usage: npx tsx query.ts <table> <id> OR npx tsx query.ts \"SELECT ...\"");
    }
}

main();
