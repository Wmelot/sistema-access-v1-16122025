
const { Client } = require('pg');
const { randomUUID } = require('crypto');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const legacy = new Client({
    connectionString: 'postgresql://postgres:Accessfisio%402022@db.djhipxldlkvkcrmudinv.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

const local = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function importAllQuestionnaires() {
    try {
        await legacy.connect();
        await local.connect();
        console.log('✅ Connected\n');

        // 1. Get current user ID to assign ownership
        const userRes = await local.query("SELECT id FROM auth.users WHERE email = 'wmelot@gmail.com'");
        const userId = userRes.rows[0]?.id;
        if (!userId) throw new Error("User wmelot@gmail.com not found locally");

        // 2. Fetch ALL relevant forms from legacy (deduplicated by title)
        // We exclude specific ones we know are "Assessments" (Evolution, PBE, Biomechanics) if we want to keep them separate?
        // Actually, user said "Standardized" (29) + "Custom" (3).
        // Let's filter out "Evolução" and maybe duplicates of already imported ones?
        // Better: We check if title exists locally. If not, we import.

        const candidates = await legacy.query(`
            WITH ranked AS (
                SELECT *,
                    ROW_NUMBER() OVER (PARTITION BY title ORDER BY created_at DESC) as rn
                FROM form_templates
                WHERE 
                    title NOT ILIKE '%Avaliação Clínica Inteligente%' -- We already handled this
                    AND title NOT ILIKE '%Palmilha biomecânica%' -- We already handled this? Or maybe check locally.
                    AND title NOT ILIKE 'Evolução' -- Not a questionnaire
                    AND title NOT ILIKE 'Para deletar%' -- Garbage
            )
            SELECT * FROM ranked WHERE rn = 1
            ORDER BY title
        `);

        console.log(`📋 Found ${candidates.rows.length} candidates in legacy\n`);

        let imported = 0;

        for (const form of candidates.rows) {
            try {
                // Check if exists locally by TITLE
                const existing = await local.query(
                    'SELECT id FROM form_templates WHERE title = $1',
                    [form.title]
                );

                if (existing.rows.length > 0) {
                    // console.log(`⏭️  Skip (Exists): "${form.title}"`);
                    continue;
                }

                // DETERMINE TYPE
                let type = 'questionnaire';
                if (form.title.match(/Consulta Palmilha|Satisfação|Acompanhamento|Feedback/i)) {
                    type = 'followup';
                }

                // PREPARE JSON
                let fieldsJson = form.fields;
                if (typeof fieldsJson === 'string') {
                    try {
                        fieldsJson = JSON.parse(fieldsJson);
                    } catch (e) {
                        console.error(`⚠️ JSON Parse Error for "${form.title}", saving as empty array`);
                        fieldsJson = [];
                    }
                }

                const newId = randomUUID();

                await local.query(`
                    INSERT INTO form_templates (
                        id, title, description, fields, type, is_active, 
                        user_id, created_at, updated_at, deleted_at, ai_generation_script
                    )
                    VALUES ($1, $2, $3, $4::jsonb, $5, true, $6, NOW(), NOW(), NULL, NULL)
                `, [
                    newId,
                    form.title,
                    form.description || '',
                    JSON.stringify(fieldsJson),
                    type,
                    userId
                ]);

                console.log(`✅ Imported: "${form.title}" (${type})`);
                imported++;

            } catch (error) {
                console.error(`❌ Error importing "${form.title}": ${error.message}`);
            }
        }

        console.log(`\n🎉 Total Imported: ${imported}`);

    } catch (error) {
        console.error('Fatal Error:', error);
    } finally {
        await legacy.end();
        await local.end();
    }
}

importAllQuestionnaires();
