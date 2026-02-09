import pkg from 'pg';
const { Client } = pkg;

const directUrl = "postgresql://postgres:0xw8SnQc09fHn7S4@db.robptuukezhqvtasjyhz.supabase.co:5432/postgres";

async function run() {
    const client = new Client({ connectionString: directUrl });
    try {
        await client.connect();
        const res = await client.query(`
            SELECT b.name as brand_name, 
                   string_agg(f.method || ':' || f.installments || ':' || f.fee_percent || ':' || COALESCE(f.fee_fixed, 0), '|') as fingerprint
            FROM public.payment_method_fees f
            JOIN public.payment_acquirers a ON f.acquirer_id = a.id
            JOIN public.card_brands b ON f.card_brand_id = b.id
            WHERE a.name = 'SumUp'
            GROUP BY b.name
        `);
        res.rows.forEach(r => {
            console.log(`Brand: ${r.brand_name}, Fingerprint length: ${r.fingerprint.length}`);
            // Sample fingerprint check
            if (r.fingerprint.length > 50) {
                console.log(`Sample: ${r.fingerprint.substring(0, 100)}...`);
            }
        });

        const uniqueFingerprints = new Set(res.rows.map(r => r.fingerprint));
        console.log("Unique fingerprints for SumUp:", uniqueFingerprints.size);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

run();
