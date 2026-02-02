
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function migrate() {
    const client = new pg.Client({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log('Connected to database');

        await client.query(`
            ALTER TABLE message_templates 
            ADD COLUMN IF NOT EXISTS reinforcement_8h boolean DEFAULT true, 
            ADD COLUMN IF NOT EXISTS reinforcement_2h boolean DEFAULT true;
        `);

        console.log('Migration successful: reinforcement columns added.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

migrate();
