
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

async function importQuestionnairesFixed() {
    try {
        await legacy.connect();
        await local.connect();
        console.log('✅ Connected\n');

        // Get questionnaires with most recent version only
        const questionnaires = await legacy.query(`
            WITH ranked AS (
                SELECT *,
                    ROW_NUMBER() OVER (PARTITION BY title ORDER BY created_at DESC) as rn
                FROM form_templates
                WHERE 
                    title ILIKE '%DASH%' OR
                    title ILIKE '%AOFAS%' OR
                    title ILIKE '%Roland%' OR
                    title ILIKE '%Lysholm%' OR
                    title ILIKE '%Quebec%' OR
                    title ILIKE '%Tampa%' OR
                    title ILIKE '%PRWE%' OR
                    title ILIKE '%PSFS%' OR
                    title ILIKE '%Consulta Palmilha%'
            )
            SELECT * FROM ranked WHERE rn = 1
            ORDER BY title
        `);

        console.log(`📋 Found ${questionnaires.rows.length} unique questionnaires\n`);

        let imported = 0;

        for (const quest of questionnaires.rows) {
            try {
                // Check if exists
                const existing = await local.query(
                    'SELECT id FROM form_templates WHERE title = $1',
                    [quest.title]
                );

                if (existing.rows.length > 0) {
                    console.log(`⏭️  Skip: "${quest.title}"`);
                    continue;
                }

                const newId = randomUUID();

                // Convert fields to proper JSON
                let fieldsJson = quest.fields;
                if (typeof fieldsJson === 'string') {
                    fieldsJson = JSON.parse(fieldsJson);
                }

                await local.query(`
                    INSERT INTO form_templates (
                        id, title, description, fields, type, is_active, created_at, updated_at
                    )
                    VALUES ($1, $2, $3, $4::jsonb, $5, true, NOW(), NOW())
                `, [
                    newId,
                    quest.title,
                    quest.description || 'Questionário padronizado',
                    JSON.stringify(fieldsJson),
                    'questionnaire'
                ]);

                console.log(`✅ "${quest.title}"`);
                imported++;

            } catch (error) {
                console.error(`❌ "${quest.title}": ${error.message}`);
            }
        }

        console.log(`\n🎉 Imported: ${imported} questionnaires`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await legacy.end();
        await local.end();
    }
}

importQuestionnairesFixed();
