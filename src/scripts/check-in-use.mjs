import pkg from 'pg';
const { Client } = pkg;

const directUrl = "postgresql://postgres:0xw8SnQc09fHn7S4@db.robptuukezhqvtasjyhz.supabase.co:5432/postgres";

async function run() {
    const client = new Client({ connectionString: directUrl });
    try {
        await client.connect();
        const res = await client.query(`
            SELECT DISTINCT a.name 
            FROM public.payment_method_fees f 
            JOIN public.payment_acquirers a ON f.acquirer_id = a.id
        `);
        console.log("Acquirers names in Use:", res.rows.map(r => r.name));

        const resManual = await client.query("SELECT COUNT(*) FROM public.payment_method_fees WHERE acquirer_id IS NULL");
        console.log("Fees without Acquirer:", resManual.rows[0].count);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

run();
