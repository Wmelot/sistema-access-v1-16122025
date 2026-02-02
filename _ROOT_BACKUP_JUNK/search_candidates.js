const fs = require('fs');

const backupPath = '_MASTER_BACKUP_WARLEY_V1.json';
const TERMS = ['Clinica', 'Clínica', 'Anamnese', 'Assessment', 'Form', 'Prontuario', 'Evolution'];

console.log('Reading backup file...');
const data = fs.readFileSync(backupPath, 'utf8');
const backup = JSON.parse(data);

console.log('Searching keys for generic terms...');

if (backup.files) {
    Object.keys(backup.files).forEach(filePath => {
        const lowerPath = filePath.toLowerCase();
        if (TERMS.some(t => lowerPath.includes(t.toLowerCase()))) {
            console.log(`[CANDIDATE] ${filePath}`);
        }
    });
}
