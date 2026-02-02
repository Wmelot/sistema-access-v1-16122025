
const { Client } = require('pg');

const config = {
    user: 'postgres',
    password: 'WMFM@26222425',
    host: 'db.robptuukezhqvtasjyhz.supabase.co',
    port: 5432,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
};

async function restoreRBAC() {
    console.log('🛡️ RESTORING RBAC (ROLES & PERMISSIONS) - V2...');
    const client = new Client(config);
    try {
        await client.connect();

        // 1. SEED ROLES (Already done, but safe to re-run due to ON CONFLICT)
        console.log('🌱 Seeding Roles...');
        const roles = [
            { name: 'Master', description: 'Acesso total ao sistema' },
            { name: 'Admin', description: 'Administrador da clínica' },
            { name: 'Professional', description: 'Fisioterapeuta/Profissional de saúde' },
            { name: 'Receptionist', description: 'Recepcionista/Secretária' }
        ];

        const roleMap = {};

        for (const r of roles) {
            const res = await client.query(`
                INSERT INTO roles (name, description, is_system)
                VALUES ($1, $2, true)
                ON CONFLICT (name) DO UPDATE SET description = $2
                RETURNING id;
            `, [r.name, r.description]);
            roleMap[r.name] = res.rows[0].id;
        }

        // 2. ASSIGN MASTER ROLE TO ADMINS
        console.log('👑 Assigning Master Role...');
        const admins = ['wmelot@gmail.com', 'accessfisio@gmail.com'];
        for (const email of admins) {
            const res = await client.query(`
                UPDATE profiles 
                SET role_id = $1 
                WHERE email = $2
                RETURNING id;
            `, [roleMap['Master'], email]);
            if (res.rows.length) console.log(`✅ Assigned Master to: ${email}`);
        }

        // 3. SEED PERMISSIONS (Using 'code' instead of 'slug')
        console.log('🔐 Seeding Permissions...');
        const permissions = [
            { code: 'system.access', description: 'General System Access' },
            { code: 'system.view_logs', description: 'View and Delete Logs/Records' },
            { code: 'roles.manage', description: 'Manage Roles & Permissions' },
            { code: 'settings.edit', description: 'Edit System Settings' },
            { code: 'financial.view_clinic', description: 'View Clinic Financials' },
            { code: 'system.manage_apis', description: 'Manage API Keys' },
            // Add some likely implied ones
            { code: 'patients.view', description: 'View Patients' },
            { code: 'patients.edit', description: 'Edit Patients' },
            { code: 'appointments.view', description: 'View Schedule' },
            { code: 'appointments.edit', description: 'Edit Schedule' }
        ];

        for (const p of permissions) {
            await client.query(`
                INSERT INTO permissions (code, description, module) 
                VALUES ($1, $2, 'system') 
                ON CONFLICT (code) DO NOTHING;
            `, [p.code, p.description]);
        }

        // 4. LINK PERMISSIONS TO MASTER ROLE
        console.log('🔗 Linking Permissions to Master...');
        await client.query(`
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT $1, id FROM permissions
            ON CONFLICT DO NOTHING;
        `, [roleMap['Master']]);
        console.log('✅ Granted ALL permissions to Master role.');

        // 5. GRANT TO ADMIN ROLE (Subset)
        // Just for safety if they log in as Admin somewhere
        await client.query(`
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT $1, id FROM permissions WHERE code NOT LIKE 'system.manage_apis'
            ON CONFLICT DO NOTHING;
        `, [roleMap['Admin']]);


        console.log('✨ RBAC RESTORE COMPLETED ✨');

    } catch (err) {
        console.error('❌ RBAC RESTORE ERROR:', err.message);
    } finally {
        await client.end();
    }
}

restoreRBAC();
