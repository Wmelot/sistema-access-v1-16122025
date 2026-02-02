import { db } from './src/lib/db';

async function checkRoles() {
    try {
        const res = await db.query('SELECT * FROM roles LIMIT 10');
        console.log('Roles:', res.rows);
        
        const cols = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'roles'");
        console.log('Columns:', cols.rows.map(r => r.column_name));
    } catch (e) {
        console.error(e);
    }
}

checkRoles();
