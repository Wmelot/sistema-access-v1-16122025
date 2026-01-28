const { Client } = require('pg');

const connectionString = "postgresql://postgres:0xw8SnQc09fHn7S4@db.robptuukezhqvtasjyhz.supabase.co:5432/postgres";

async function run() {
    const client = new Client({ connectionString });
    await client.connect();
    try {
        console.log("Checking and adding columns...");
        await client.query("ALTER TABLE public.clinic_settings ADD COLUMN IF NOT EXISTS google_review_url TEXT;");
        await client.query("ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS google_review_url TEXT;");

        console.log("Updating default records...");
        await client.query("UPDATE public.clinic_settings SET google_review_url = 'https://g.page/r/CZFUQUQVoZs8JEBM/review' WHERE id = '9571532e-fdf8-4aaa-b236-416fd6459566' AND (google_review_url IS NULL OR google_review_url = '');");

        console.log("Nudging PostgREST cache...");
        await client.query("NOTIFY pgrst, 'reload config';");
        await client.query("NOTIFY pgrst, 'reload schema';"); // Some versions use schema

        console.log("Database updated successfully!");
    } catch (err) {
        console.error("Database update failed:", err);
    } finally {
        await client.end();
    }
}

run();
