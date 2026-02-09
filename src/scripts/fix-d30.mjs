import pkg from 'pg';
const { Client } = pkg;

const directUrl = "postgresql://postgres:0xw8SnQc09fHn7S4@db.robptuukezhqvtasjyhz.supabase.co:5432/postgres";

async function run() {
    const client = new Client({ connectionString: directUrl });
    try {
        await client.connect();

        console.log("Setting ALL Asaas and C6 Pay to D+30...");

        await client.query("UPDATE public.payment_acquirers SET receipt_days = 30 WHERE name IN ('Asaas', 'C6 Pay')");

        console.log("Update complete.");
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

run();
