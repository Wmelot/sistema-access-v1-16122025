
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
        console.log('✅ Connected to both databases\n');

        // Get all questionnaires (active and inactive)
        const questionnaires = await legacy.query(`
            SELECT * FROM form_templates
            WHERE 
                title ILIKE '%DASH%' OR
                title ILIKE '%AOFAS%' OR
                title ILIKE '%Roland%' OR
                title ILIKE '%Morris%' OR
                title ILIKE '%Lysholm%' OR
                title ILIKE '%Quebec%' OR
                title ILIKE '%Tampa%' OR
                title ILIKE '%PRWE%' OR
                title ILIKE '%PSFS%' OR
                title ILIKE '%Consulta Palmilha%'
            ORDER BY title, created_at DESC
        `);

        console.log(`📋 Found ${questionnaires.rows.length} questionnaires to import\n`);

        let imported = 0;
        let skipped = 0;
        const imported_titles = new Set();

        for (const quest of questionnaires.rows) {
            try {
                // Skip duplicates (keep only the most recent version of each title)
                if (imported_titles.has(quest.title)) {
                    console.log(`⏭️  Skipping duplicate: "${quest.title}"`);
                    skipped++;
                    continue;
                }

                // Check if already exists locally
                const existing = await local.query(
                    'SELECT id FROM form_templates WHERE title = $1',
                    [quest.title]
                );

                if (existing.rows.length > 0) {
                    console.log(`⚠️  Already exists: "${quest.title}"`);
                    skipped++;
                    continue;
                }

                // Generate new ID
                const newId = randomUUID();

                // Import with new ID
                await local.query(`
                    INSERT INTO form_templates (
                        id, title, description, fields, type, is_active, created_at, updated_at
                    )
                    VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
                `, [
                    newId,
                    quest.title,
                    quest.description || 'Questionário padronizado importado',
                    quest.fields,
                    'questionnaire', // Set type as questionnaire
                    // Always set as active (true)
                ]);

                console.log(`✅ Imported: "${quest.title}"`);
                imported_titles.add(quest.title);
                imported++;

            } catch (error) {
                console.error(`❌ Error importing "${quest.title}":`, error.message);
            }
        }

        console.log(`\n🎉 Import complete!`);
        console.log(`   Imported: ${imported}`);
        console.log(`   Skipped: ${skipped}`);
        console.log(`\n✅ All questionnaires are now active and ready to use!`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await legacy.end();
        await local.end();
    }
}

importAllQuestionnaires();
