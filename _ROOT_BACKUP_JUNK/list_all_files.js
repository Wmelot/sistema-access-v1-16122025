const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('_MASTER_BACKUP_WARLEY_V1.json', 'utf8'));

if (backup.files) {
    Object.keys(backup.files).sort().forEach(f => console.log(f));
}
