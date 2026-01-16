
const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const client = new Client({
    connectionString: 'postgresql://postgres:Accessfisio%402022@db.djhipxldlkvkcrmudinv.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function listAllCandidates() {
    try {
        await client.connect();

        // Let's find everything that is NOT an 'evolution' (assuming we only want forms/questionnaires)
        // We will list count and grouping to understand what we have.
        const res = await client.query(`
            SELECT type, count(*) 
            FROM form_templates 
            -- WHERE deleted_at IS NULL (We want to see ALL)
            GROUP BY type
        `);
        console.log("--- Summary by Type in Legacy ---");
        console.table(res.rows);

        // Now let's list titles of everything that looks like a questionnaire
        // Assuming 'assessment' might cover some, or 'questionnaire' if it exists, or NULL types.
        const listRes = await client.query(`
            SELECT id, title, type 
            FROM form_templates 
            -- WHERE deleted_at IS NULL
            ORDER BY title
        `);

        console.log("\n--- All Active Forms in Legacy ---");
        // We'll log them all to grep/search later if needed, or just partial
        listRes.rows.forEach(r => console.log(`[${r.type}] ${r.title} (${r.id})`));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.end();
    }
}

listAllCandidates();
