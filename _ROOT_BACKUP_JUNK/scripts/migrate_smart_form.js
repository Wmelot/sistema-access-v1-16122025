
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

async function migrateSmartForm() {
    try {
        await legacy.connect();
        await local.connect();
        console.log('Connected.');

        // Get the complete "Avaliação Clínica Inteligente" form
        const legacyForm = await legacy.query(`
            SELECT * FROM form_templates 
            WHERE title ILIKE '%clínica%inteligente%' 
            OR title ILIKE '%biomecânica%'
            OR id = 'e5f3c4b2-1a2b-3c4d-5e6f-7a8b9c0d1e2f'
            ORDER BY updated_at DESC
            LIMIT 1
        `);

        if (legacyForm.rows.length === 0) {
            console.log('Form not found. Trying broader search...');
            const allForms = await legacy.query(`SELECT id, title, type FROM form_templates WHERE is_active = true`);
            console.table(allForms.rows);
            return;
        }

        const form = legacyForm.rows[0];
        console.log(`Found form: "${form.title}"`);
        console.log(`Fields: ${form.fields.length}`);
        console.log(`Type: ${form.type}`);

        // Check if form already exists locally
        const existingForm = await local.query(`
            SELECT id FROM form_templates WHERE title = $1
        `, [form.title]);

        if (existingForm.rows.length > 0) {
            console.log('Form exists locally. Updating...');
            await local.query(`
                UPDATE form_templates 
                SET fields = $1, 
                    description = $2,
                    updated_at = NOW(),
                    is_active = true
                WHERE title = $3
            `, [JSON.stringify(form.fields), form.description, form.title]);
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

        // Save form to file for backup
        fs.writeFileSync(
            '/Users/wmelo/Axiom/backup_smart_form.json',
            JSON.stringify(form, null, 2)
        );
        console.log('✅ Form backed up to backup_smart_form.json');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await legacy.end();
        await local.end();
    }
}

migrateSmartForm();
