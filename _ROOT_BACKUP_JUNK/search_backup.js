const fs = require('fs');

const backupPath = '_MASTER_BACKUP_WARLEY_V1.json';
const TERMS = ['Avaliação Clínica PBE', 'Palmilha Biomecânica', 'Avaliação Física Avançada', 'PBE', 'Palmilha', 'Biomecânica', 'Avançada'];

console.log('Reading backup file...');
const data = fs.readFileSync(backupPath, 'utf8');
const backup = JSON.parse(data);

console.log('Searching keys and content...');

if (backup.files) {
    Object.keys(backup.files).forEach(filePath => {
        const content = backup.files[filePath];

        let match = false;
        // Check filepath
        if (TERMS.some(t => filePath.toLowerCase().includes(t.toLowerCase()))) {
            console.log(`[MATCH PATH] ${filePath}`);
            match = true;
        }

        // Check content (first 500 chars usually contains title/header) and also look for specific strings deeper
        TERMS.forEach(term => {
            if (content.includes(term)) {
                // If it's a huge minified file, simple includes is fine, but we want to know Context.
                // Just report match for now.
                console.log(`[MATCH CONTENT] ${filePath} (contains "${term}")`);
                match = true;
            }
        });
    });
} else {
    console.log('No "files" key found in backup.');
}
