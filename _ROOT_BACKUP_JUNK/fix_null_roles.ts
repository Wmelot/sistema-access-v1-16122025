
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool({
    connectionString: "postgresql://postgres:0xw8SnQc09fHn7S4@db.robptuukezhqvtasjyhz.supabase.co:5432/postgres",
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log("🔍 Finding profiles with NULL role_id...");

        const res = await pool.query(`
            SELECT id, email, organization_id 
            FROM profiles 
            WHERE role_id IS NULL AND organization_id IS NOT NULL
        `);

        if (res.rows.length === 0) {
            console.log("✅ No profiles need fixing.");
            return;
        }

        console.log(`🔨 Fixing ${res.rows.length} profiles...`);

        for (const user of res.rows) {
            console.log(`\nProcessing user: ${user.email} (Org: ${user.organization_id})`);

            // 1. Check if roles exist for this Org
            const rolesRes = await pool.query(
                "SELECT id, name FROM roles WHERE organization_id = $1",
                [user.organization_id]
            );

            let adminRoleId = null;

            if (rolesRes.rows.length > 0) {
                console.log("  Roles found.");
                const adminRole = rolesRes.rows.find(r => r.name === 'Admin' || r.name === 'admin');
                adminRoleId = adminRole?.id;
            } else {
                console.log("  ⚠️ No roles found provided for this Org. Creating defaults...");

                const newRoles = [
                    { id: uuidv4(), name: 'Admin', description: 'Administrador', is_system: true, organization_id: user.organization_id },
                    { id: uuidv4(), name: 'Profissional', description: 'Profissional', is_system: true, organization_id: user.organization_id },
                    { id: uuidv4(), name: 'Recepcionista', description: 'Recepcionista', is_system: true, organization_id: user.organization_id }
                ];

                for (const role of newRoles) {
                    await pool.query(
                        "INSERT INTO roles (id, name, description, is_system, organization_id) VALUES ($1, $2, $3, $4, $5)",
                        [role.id, role.name, role.description, role.is_system, role.organization_id]
                    );
                    if (role.name === 'Admin') adminRoleId = role.id;
                }
                console.log("  ✅ Roles created.");
            }

            if (adminRoleId) {
                await pool.query(
                    "UPDATE profiles SET role_id = $1, role = 'admin' WHERE id = $2",
                    [adminRoleId, user.id]
                );
                console.log(`  ✅ User ${user.email} updated with Admin Role ID: ${adminRoleId}`);
            } else {
                console.error("  ❌ Failed to identify Admin role ID.");
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

run();
