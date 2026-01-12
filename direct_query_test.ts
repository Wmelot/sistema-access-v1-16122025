import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function directQuery() {
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    await client.connect();

    try {
        const res = await client.query(`
            SELECT o.id, o.name, p.max_professionals 
            FROM organizations o
            LEFT JOIN plan_configs p ON o.plan_config_id = p.id
            WHERE o.id = '00000000-0000-0000-0000-000000000001'
        `);
        console.log("Direct Query Result:", res.rows[0]);
    } catch (err) {
        console.error("Direct Query Error:", err);
    } finally {
        await client.end();
    }
}

directQuery();
