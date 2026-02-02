
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

async function importLegacyForm() {
    try {
        await legacy.connect();
        await local.connect();
        console.log('Connected to both databases.');

        // Search for "Avaliação Clínica Inteligente" in legacy
        const legacyForms = await legacy.query(`
            SELECT * FROM form_templates 
            WHERE title ILIKE '%clínica%inteligente%'
            AND deleted_at IS NULL
            ORDER BY updated_at DESC
        `);

        if (legacyForms.rows.length === 0) {
            console.log('❌ Form not found in legacy database');
            return;
        }

        const form = legacyForms.rows[0];
        console.log(`\n✅ Found: "${form.title}"`);
        console.log(`   Fields: ${form.fields ? form.fields.length : 0}`);
        console.log(`   Created: ${form.created_at}`);

        // Generate new ID to avoid conflicts
        const newId = require('crypto').randomUUID();
        const newTitle = 'Avaliação Clínica Inteligente (Legado)';

        // Check if already exists
        const existing = await local.query(`
            SELECT id FROM form_templates WHERE title = $1
        `, [newTitle]);

        if (existing.rows.length > 0) {
            console.log(`\n⚠️  Form "${newTitle}" already exists locally. Skipping.`);
            return;
        }

        // Insert with new ID and title
        await local.query(`
            INSERT INTO form_templates (
                id, title, description, fields, is_active, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, true, NOW(), NOW())
        `, [
            newId,
            newTitle,
            form.description || 'Formulário importado da base legada',
            JSON.stringify(form.fields)
        ]);

        console.log(`\n✅ Form imported successfully!`);
        console.log(`   New ID: ${newId}`);
        console.log(`   Title: ${newTitle}`);
        console.log(`   Fields: ${form.fields ? form.fields.length : 0}`);

        // Save backup
        fs.writeFileSync(
            '/Users/wmelo/Axiom/backup_legacy_form.json',
            JSON.stringify(form, null, 2)
        );
        console.log(`\n💾 Backup saved to backup_legacy_form.json`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await legacy.end();
        await local.end();
    }
}

importLegacyForm();
