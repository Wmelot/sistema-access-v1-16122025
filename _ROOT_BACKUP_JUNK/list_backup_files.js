const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('_MASTER_BACKUP_WARLEY_V1.json', 'utf8'));
if (backup.files) {
    console.log('Files found in backup:');
    Object.keys(backup.files).forEach(f => console.log(f));
} else {
    console.log('No files key found.');
}
