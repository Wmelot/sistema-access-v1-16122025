
const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function assignOwner() {
    try {
        await client.connect();

        // 1. Get User ID (Assuming single user or specific email)
        const userRes = await client.query(`
            SELECT id, email FROM auth.users WHERE email = 'wmelot@gmail.com'
        `);

        if (userRes.rows.length === 0) {
            console.log('User not found!');
            return;
        }

        const userId = userRes.rows[0].id;
        console.log(`User ID for wmelot@gmail.com: ${userId}`);

        // 2. Update form templates with NULL user_id
        const updateRes = await client.query(`
            UPDATE form_templates
            SET user_id = $1
            WHERE user_id IS NULL
        `, [userId]);

        console.log(`Updated ${updateRes.rowCount} forms to belong to this user.`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.end();
    }
}

assignOwner();
