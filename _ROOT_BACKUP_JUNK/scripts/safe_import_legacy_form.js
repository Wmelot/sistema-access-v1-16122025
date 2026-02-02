
const { Client } = require('pg');
const { randomUUID } = require('crypto');
const fs = require('fs');
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

async function safeImportLegacyForm() {
    try {
        await legacy.connect();
        await local.connect();
        console.log('✅ Connected to both databases\n');

        // 1. GET LEGACY FORM (with specific ID to be safe)
        const legacyId = 'd4c4a6c0-7b2a-4b6e-9c2b-8e1d7f6a5b4c';
        const legacyForm = await legacy.query(
            'SELECT * FROM form_templates WHERE id = $1',
            [legacyId]
        );

        if (legacyForm.rows.length === 0) {
            console.log('❌ Form not found in legacy database');
            return;
        }

        const form = legacyForm.rows[0];
        console.log(`📋 Found: "${form.title}"`);
        console.log(`   Type: ${form.type}`);
        console.log(`   Created: ${form.created_at}\n`);

        // 2. BACKUP ORIGINAL
        const backupPath = '/Users/wmelo/Axiom/backup_legacy_smart_assessment.json';
        fs.writeFileSync(backupPath, JSON.stringify(form, null, 2));
        console.log(`💾 Backup saved to: ${backupPath}\n`);

        // 3. CHECK IF ALREADY IMPORTED
        const newTitle = 'Avaliação Clínica Inteligente (Legado)';
        const existing = await local.query(
            'SELECT id, title FROM form_templates WHERE title = $1',
            [newTitle]
        );

        if (existing.rows.length > 0) {
            console.log(`⚠️  Form "${newTitle}" already exists locally!`);
            console.log(`   Existing ID: ${existing.rows[0].id}`);
            console.log(`\n✅ Skipping import to avoid duplicates.`);
            return;
        }

        // 4. GENERATE NEW ID (CRITICAL: Never use old ID!)
        const newId = randomUUID();
        console.log(`🆕 Generated new ID: ${newId}`);
        console.log(`   Old ID was: ${form.id}\n`);

        // 5. IMPORT WITH NEW ID AND TITLE
        await local.query(`
            INSERT INTO form_templates (
                id, title, description, fields, is_active, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `, [
            newId,
            newTitle,
            form.description || 'Formulário importado da base legada',
            form.fields,
            true
        ]);

        console.log(`✅ Form imported successfully!`);
        console.log(`   New Title: "${newTitle}"`);
        console.log(`   New ID: ${newId}`);
        console.log(`\n🎉 Import complete! No existing forms were modified.`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await legacy.end();
        await local.end();
    }
}

safeImportLegacyForm();
