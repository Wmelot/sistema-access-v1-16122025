
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

async function forceReset() {
    console.log('Connecting to DB to force password update...');
    const client = new Client(config);
    try {
        await client.connect();

        const email = 'wmelot@gmail.com';
        const newPassword = 'Wmelo@123';

        console.log(`Resetting password for ${email} to ${newPassword}...`);

        // Use pgcrypto to hash the password correctly for Supabase Auth (bcrypt)
        const query = `
            UPDATE auth.users
            SET encrypted_password = crypt($1, gen_salt('bf'))
            WHERE email = $2
            RETURNING id, email;
        `;

        const res = await client.query(query, [newPassword, email]);

        if (res.rowCount === 0) {
            console.error('❌ User not found or update failed!');
        } else {
            console.log('✅ Password updated successfully!');
            console.log('   User ID:', res.rows[0].id);
        }

    } catch (err) {
        console.error('❌ Error updating password:', err.message);
        if (err.message.includes('function crypt(unknown, unknown) does not exist')) {
            console.error('   Hint: pgcrypto extension might need to be enabled: "CREATE EXTENSION IF NOT EXISTS pgcrypto;"');
        }
    } finally {
        await client.end();
    }
}

forceReset();
