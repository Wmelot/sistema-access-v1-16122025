
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

async function diagnoseProfiles() {
    console.log('🕵️ DIAGNOSING PROFILES...');
    const client = new Client(config);
    try {
        await client.connect();

        const res = await client.query(`
            SELECT 
                p.id, 
                p.email, 
                p.full_name, 
                p.role_id, 
                r.name as role_name,
                p.role as role_text_column
            FROM profiles p
            LEFT JOIN roles r ON p.role_id = r.id
            ORDER BY p.created_at DESC
            LIMIT 10;
        `);

        console.table(res.rows);

        // Check if role 'Professional' exists to fix role_ids
        const roleRes = await client.query("SELECT id, name FROM roles WHERE name = 'Professional'");
        if (roleRes.rows.length) {
            console.log('Professional Role ID:', roleRes.rows[0].id);
        } else {
            console.log('WARNING: Professional Role NOT FOUND.');
        }

    } catch (err) {
        console.error('❌ ERROR:', err.message);
    } finally {
        await client.end();
    }
}

diagnoseProfiles();
