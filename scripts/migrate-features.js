const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..', 'src');
const featuresDir = path.join(rootDir, 'features');
const formsDir = path.join(featuresDir, 'forms');
const questionnairesDir = path.join(featuresDir, 'questionnaires');
const protocolsDir = path.join(featuresDir, 'protocols');

// Folders to move into src/features/forms
const targets = [
    'palmilha-5',
    'palmilha-biomecanica',
    'pbe',
    'smart-assessment',
    'womens-health',
    'clinical-evolution'
];

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function processFiles(dir, callback) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processFiles(fullPath, callback);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            callback(fullPath);
        }
    }
}

// 1. Create Directories
console.log('Creating directories...');
ensureDir(formsDir);
ensureDir(path.join(questionnairesDir, 'padronizados'));
ensureDir(path.join(questionnairesDir, 'acompanhamentos'));
ensureDir(path.join(protocolsDir, 'dor-lombar'));

// 2. Setup Move
console.log('Moving directories...');
const movedTargets = [];
for (const target of targets) {
    const sourcePath = path.join(featuresDir, target);
    const destPath = path.join(formsDir, target);
    if (fs.existsSync(sourcePath)) {
        fs.renameSync(sourcePath, destPath);
        console.log(`Moved ${target} to forms/${target}`);
        movedTargets.push(target);
    }
}

// 3. Update Imports globally
console.log('Updating imports...');
processFiles(rootDir, (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    for (const target of movedTargets) {
        // Replace `@/features/<target>` with `@/features/forms/<target>`
        const regex1 = new RegExp(`@/features/${target}(/|'|")`, 'g');
        if (regex1.test(content)) {
            content = content.replace(regex1, `@/features/forms/${target}$1`);
            changed = true;
        }

        // Replace `features/<target>` if imported relative without @ (less common)
        const regex2 = new RegExp(`features/${target}(/|'|")`, 'g');
        if (regex2.test(content)) {
            // Only if it doesn't already have forms/
            if (!content.includes(`features/forms/${target}`)) {
                content = content.replace(regex2, `features/forms/${target}$1`);
                changed = true;
            }
        }
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated imports in ${filePath}`);
    }
});

console.log('Done!');
