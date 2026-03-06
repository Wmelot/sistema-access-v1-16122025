
import { db } from './src/lib/db';

async function checkUsers() {
    try {
        console.log("--- PROFILES IN ACCESS FISIOTERAPIA ---");
        const { rows: profiles } = await db.query(`
            SELECT p.id, p.full_name, p.email, p.organization_id, r.name as role_name 
            FROM profiles p
            LEFT JOIN roles r ON p.role_id = r.id
            WHERE p.organization_id = '9571532e-fdf8-4aaa-b236-416fd6459566'
        `);
        console.table(profiles);

        console.log("\n--- AUTH USERS COUNT ---");
        const { rows: authCount } = await db.query("SELECT count(*) FROM auth.users");
        console.log("Total auth users:", authCount[0].count);

        console.log("\n--- ORPHAN PROFILES (No matching Auth User) ---");
        const { rows: orphans } = await db.query(`
            SELECT p.id, p.full_name, p.email 
            FROM profiles p 
            LEFT JOIN auth.users u ON p.id = u.id 
            WHERE u.id IS NULL AND p.organization_id = '9571532e-fdf8-4aaa-b236-416fd6459566'
        `);
        console.table(orphans);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsers();
