
const { Client } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config({ path: '.env.local' });

const legacy = new Client({
    connectionString: 'postgresql://postgres:Accessfisio%402022@db.djhipxldlkvkcrmudinv.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

const local = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrateCorrectForm() {
    try {
        await legacy.connect();
        await local.connect();
        console.log('Connected.');

        // Get ALL forms to see which one has the most fields
        const allForms = await legacy.query(`
            SELECT id, title, description, 
                   jsonb_array_length(fields) as field_count,
                   is_active, deleted_at
            FROM form_templates 
            WHERE deleted_at IS NULL
            ORDER BY jsonb_array_length(fields) DESC
        `);

        console.log('All Forms (sorted by field count):');
        console.table(allForms.rows);

        // Get the form with most fields (likely the complete one)
        const formId = allForms.rows[0].id;
        console.log(`\nMigrating form: ${allForms.rows[0].title} (${allForms.rows[0].field_count} fields)`);

        const legacyForm = await legacy.query(`SELECT * FROM form_templates WHERE id = $1`, [formId]);
        const form = legacyForm.rows[0];

        // Save to backup
        fs.writeFileSync(
            '/Users/wmelo/Axiom/backup_complete_form.json',
            JSON.stringify(form, null, 2)
        );
        console.log('✅ Form backed up to backup_complete_form.json');

        // Check if exists locally
        const existingForm = await local.query(`SELECT id FROM form_templates WHERE id = $1`, [form.id]);

        if (existingForm.rows.length > 0) {
            console.log('Form exists locally. Updating...');
            await local.query(`
                UPDATE form_templates 
                SET fields = $1, 
                    title = $2,
                    description = $3,
                    updated_at = NOW(),
                    is_active = true
                WHERE id = $4
            `, [JSON.stringify(form.fields), form.title, form.description, form.id]);
            console.log('✅ Form updated successfully!');
        } else {
            console.log('Form does not exist locally. Creating...');
            await local.query(`
                INSERT INTO form_templates (
                    id, title, description, fields, is_active, created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, true, NOW(), NOW())
            `, [form.id, form.title, form.description, JSON.stringify(form.fields)]);
            console.log('✅ Form created successfully!');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await legacy.end();
        await local.end();
    }
}

migrateCorrectForm();
