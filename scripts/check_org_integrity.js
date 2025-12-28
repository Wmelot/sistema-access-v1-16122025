const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function run() {
    console.log('Connecting to DB...');
    const client = new Client({ connectionString });
    try {
        await client.connect();

        console.log('Checking Profiles for Organization ID...');
        const res = await client.query(`
            SELECT 
                count(*) as total_users,
                count(organization_id) as users_with_org,
                count(*) - count(organization_id) as users_without_org
            FROM public.profiles;
        `);

        console.log('RESULT:', res.rows[0]);

        if (parseInt(res.rows[0].users_without_org) > 0) {
            console.log('WARNING: Some users have NO organization_id. RLS update will lock them out.');
        } else {
            console.log('GREEN: All users have organizations. Safe to proceed.');
        }

    } catch (err) {
        console.error('ERROR performing DB operations:', err);
    } finally {
        await client.end();
    }
}

run();
