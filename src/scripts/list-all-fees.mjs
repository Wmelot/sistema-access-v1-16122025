import pkg from 'pg';
const { Client } = pkg;

const directUrl = "postgresql://postgres:0xw8SnQc09fHn7S4@db.robptuukezhqvtasjyhz.supabase.co:5432/postgres";

async function run() {
    const client = new Client({ connectionString: directUrl });
    try {
        await client.connect();
        const res = await client.query(`
            SELECT a.name as acquirer_name, b.name as brand_name, f.installments, f.fee_percent, f.fee_fixed
            FROM public.payment_method_fees f
            JOIN public.payment_acquirers a ON f.acquirer_id = a.id
            JOIN public.card_brands b ON f.card_brand_id = b.id
            ORDER BY a.name, b.name, f.installments
        `);
        console.log("All fees:", JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

run();
