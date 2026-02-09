import pkg from 'pg';
const { Client } = pkg;

const directUrl = "postgresql://postgres:0xw8SnQc09fHn7S4@db.robptuukezhqvtasjyhz.supabase.co:5432/postgres";

async function run() {
    const client = new Client({ connectionString: directUrl });
    try {
        await client.connect();
        const res = await client.query("SELECT * FROM public.payment_acquirers");
        console.log("Acquirers:", JSON.stringify(res.rows, null, 2));

        const resFees = await client.query(`
            SELECT f.*, b.name as brand_name, a.name as acquirer_name 
            FROM public.payment_method_fees f
            JOIN public.card_brands b ON f.card_brand_id = b.id
            LEFT JOIN public.payment_acquirers a ON f.acquirer_id = a.id
            LIMIT 10
        `);
        console.log("Sample Fees:", JSON.stringify(resFees.rows, null, 2));
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

run();
