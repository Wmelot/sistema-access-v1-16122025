
import { db } from '../src/lib/db';
import fs from 'fs';
import path from 'path';

async function backup() {
    console.log('Starting backup...');
    try {
        // Backup Form Templates
        const { rows: templates } = await db.query('SELECT * FROM form_templates');
        fs.writeFileSync('form_templates_backup.json', JSON.stringify(templates, null, 2));
        console.log(`Backed up ${templates.length} form templates.`);

        // Backup Message Templates (Automation)
        const { rows: messages } = await db.query('SELECT * FROM message_templates');
        fs.writeFileSync('message_templates_backup.json', JSON.stringify(messages, null, 2));
        console.log(`Backed up ${messages.length} message templates.`);

    } catch (e) {
        console.error('Backup failed:', e);
    }
    process.exit(0);
}

backup();
