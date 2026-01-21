
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const dashboardPath = '/Users/wmelo/Axiom/src/app/dashboard';
const targetPath = '/Users/wmelo/Axiom/src/app/dashboard/[slug]';

if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
}

const items = fs.readdirSync(dashboardPath);

items.forEach(item => {
    if (item === '[slug]' || item === 'layout.tsx' || item === 'layout-client.tsx' || item === 'actions.ts' || item === 'rbac-actions.ts') {
        // Skip these as we want them to stay in /dashboard or they are already in the target
        return;
    }

    const oldPath = path.join(dashboardPath, item);
    const newPath = path.join(targetPath, item);

    console.log(`Moving ${oldPath} to ${newPath}`);

    // Use mv command to handle both files and directories
    try {
        execSync(`mv "${oldPath}" "${newPath}"`);
    } catch (err) {
        console.error(`Error moving ${item}:`, err.message);
    }
});

console.log("Migration complete!");
