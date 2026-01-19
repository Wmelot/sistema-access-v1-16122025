
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function simulateLoginUpdate() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Simulating Login Update (last_sign_in_at)...');

        // Use the ID we found earlier for wmelot@gmail.com
        const userId = '0273dd3c-996a-4d40-8fea-eb89118345b2';

        const res = await client.query(`
            UPDATE auth.users 
            SET last_sign_in_at = NOW() 
            WHERE id = $1
            RETURNING id, email, last_sign_in_at;
        `, [userId]);

        console.log('✅ Update Successful:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('❌ Update Failed (This explains the login error):');
        console.error(err.message);
        if (err.detail) console.error('Detail:', err.detail);
        if (err.hint) console.error('Hint:', err.hint);
        if (err.where) console.error('Where:', err.where);
    }
}

simulateLoginUpdate();
