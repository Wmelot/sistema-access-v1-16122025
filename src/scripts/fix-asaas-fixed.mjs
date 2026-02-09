import pkg from 'pg';
const { Client } = pkg;

const directUrl = "postgresql://postgres:0xw8SnQc09fHn7S4@db.robptuukezhqvtasjyhz.supabase.co:5432/postgres";

async function run() {
    const client = new Client({ connectionString: directUrl });
    try {
        await client.connect();

        console.log("Updating Asaas fees to include R$ 0,35 fixed fee...");

        // 1. Find the Asaas acquirer (Global)
        const asaasRes = await client.query("SELECT id FROM public.payment_acquirers WHERE name = 'Asaas' AND organization_id IS NULL LIMIT 1");
        const asaasId = asaasRes.rows[0]?.id;

        if (asaasId) {
            await client.query("UPDATE public.payment_method_fees SET fee_fixed = 0.35 WHERE acquirer_id = $1", [asaasId]);
            console.log("Updated fees for Asaas ID:", asaasId);
        } else {
            console.log("Asaas (Global) not found.");
        }

        // 2. Clear Any Local Asaas (to avoid confusion)
        // Actually, the user might have their own. Let's not delete but maybe they are seeing the local one?

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

run();
