
import fs from 'fs';
import path from 'path';

function escapeSql(val: any): string {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return val.toString();
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
    return `'${val.toString().replace(/'/g, "''")}'`;
}

function run() {
    try {
        const templatesPath = path.join(process.cwd(), 'form_templates_backup.json');

        let sql = '-- RESTORE FORM TEMPLATES \n';

        if (fs.existsSync(templatesPath)) {
            const templates = JSON.parse(fs.readFileSync(templatesPath, 'utf8'));

            if (templates.length > 0) {
                const keys = Object.keys(templates[0]).join(', ');

                templates.forEach((t: any) => {
                    const values = Object.values(t).map(v => escapeSql(v)).join(', ');
                    sql += `INSERT INTO public.form_templates (${keys}) VALUES (${values}) ON CONFLICT (id) DO NOTHING;\n`;
                });
            }
        }

        fs.writeFileSync(path.join(process.cwd(), 'restore_data.sql'), sql);
        console.log('SQL generated: restore_data.sql');

    } catch (e) {
        console.error('Error converting:', e);
    }
}

run();
