
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

async function testPasswordVerify() {
    console.log('🔐 TESTING PASSWORD VERIFICATION...');
    const client = new Client(config);
    try {
        await client.connect();

        const email = 'wmelot@gmail.com';
        const inputPass = 'Wmelo@123';

        // Fetch stored hash
        const res = await client.query("SELECT encrypted_password FROM auth.users WHERE email = $1", [email]);
        if (res.rows.length === 0) {
            console.log('User not found.');
            return;
        }
        const storedHash = res.rows[0].encrypted_password;
        console.log('Stored Hash:', storedHash.substring(0, 10) + '...');

        // Verify using pgcrypto (crypt)
        // Note: Supabase uses bcrypt. pgcrypto's crypt() function supports bcrypt signatures ($2a$, $2b$, etc).
        const verifyRes = await client.query("SELECT (crypt($1, $2) = $2) as match", [inputPass, storedHash]);

        console.log('Password Match Result:', verifyRes.rows[0].match);

        if (verifyRes.rows[0].match) {
            console.log('✅ PASSWORD VERIFIED VIA SQL!');
        } else {
            console.log('❌ PASSWORD MISMATCH via SQL.');
        }

    } catch (err) {
        console.error('❌ ERROR:', err.message);
    } finally {
        await client.end();
    }
}

testPasswordVerify();
