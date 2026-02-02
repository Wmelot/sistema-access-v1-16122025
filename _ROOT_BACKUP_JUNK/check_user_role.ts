
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: "postgresql://postgres:0xw8SnQc09fHn7S4@db.robptuukezhqvtasjyhz.supabase.co:5432/postgres",
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log("Checking user 'testefinal@teste.com'...");

        // 1. Get Profile
        const res = await pool.query("SELECT * FROM profiles WHERE email = 'testefinal@teste.com'");
        const profile = res.rows[0];

        if (!profile) {
            console.log("User NOT FOUND in profiles table!");
            return;
        }

        console.log("Profile Data:", profile);

        // 2. Check Role
        if (profile.role_id) {
            const roleRes = await pool.query("SELECT * FROM roles WHERE id = $1", [profile.role_id]);
            console.log("Linked Role:", roleRes.rows[0]);
        } else {
            console.log("WARNING: role_id is NULL");
        }

        // 3. Check Organization Roles
        if (profile.organization_id) {
            const orgRoles = await pool.query("SELECT * FROM roles WHERE organization_id = $1", [profile.organization_id]);
            console.log("Roles available for this Org:", orgRoles.rows);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

run();
