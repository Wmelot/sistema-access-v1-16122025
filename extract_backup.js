const fs = require('fs');
const path = require('path');
const backup = JSON.parse(fs.readFileSync('_MASTER_BACKUP_WARLEY_V1.json', 'utf8'));

const outDir = 'legacy_dump';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

if (backup.files) {
    Object.keys(backup.files).forEach(f => {
        // Preserve subdirectory structure relative to outDir?
        // The keys are like 'src/components/...'. Let's flatten or mimic structure.
        // Let's mimic structure to avoid name collisions.
        const parts = f.split('/');
        const fileName = parts.pop();
        const dirPath = path.join(outDir, ...parts);

        if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

        const content = backup.files[f];
        fs.writeFileSync(path.join(dirPath, fileName), content);
        console.log(`Extracted: ${f}`);
    });
}
