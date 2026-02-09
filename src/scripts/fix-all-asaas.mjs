import pkg from 'pg';
const { Client } = pkg;

const directUrl = "postgresql://postgres:0xw8SnQc09fHn7S4@db.robptuukezhqvtasjyhz.supabase.co:5432/postgres";

async function run() {
    const client = new Client({ connectionString: directUrl });
    try {
        await client.connect();

        console.log("Updating ALL Asaas fees (global and local)...");

        await client.query("UPDATE public.payment_method_fees SET fee_fixed = 0.35 WHERE acquirer_id IN (SELECT id FROM public.payment_acquirers WHERE name = 'Asaas')");

        console.log("Update complete.");
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

run();
