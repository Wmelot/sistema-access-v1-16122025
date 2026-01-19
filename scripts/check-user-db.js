
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function checkUserAndProfile() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const userId = '0273dd3c-996a-4d40-8fea-eb89118345b2';
        const email = 'wmelot@gmail.com';

        console.log(`Checking auth.users for ${email}...`);
        const userRes = await client.query("SELECT id, email, confirmed_at, role FROM auth.users WHERE email = $1", [email]);

        if (userRes.rows.length === 0) {
            console.log('❌ User wmelot@gmail.com NOT FOUND in auth.users.');
        } else {
            console.log('✅ User found in auth.users:', userRes.rows[0]);

            // Check Profile
            console.log(`Checking public.profiles for ID ${userId}...`);
            const profileRes = await client.query("SELECT * FROM public.profiles WHERE id = $1", [userId]);

            if (profileRes.rows.length === 0) {
                console.log('❌ Profile NOT FOUND in public.profiles.');
            } else {
                console.log('✅ Profile found in public.profiles:', profileRes.rows[0]);
            }
        }

        await client.end();
    } catch (err) {
        console.error('❌ Query failed:', err);
    }
}

checkUserAndProfile();
