
import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const config = {
    user: 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'WMFM@26222425',
    host: 'db.robptuukezhqvtasjyhz.supabase.co',
    port: 5432,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
};

async function testConnection() {
    console.log('Testing connection to:', config.host);
    console.log('User:', config.user);
    // console.log('Password:', config.password); 

    const client = new Client(config);

    try {
        await client.connect();
        console.log('✅ Connection successful!');

        const res = await client.query('SELECT count(*) FROM auth.users');
        console.log('User count via SQL:', res.rows[0].count);

        await client.end();
        process.exit(0);
    } catch (err: any) {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    }
}

testConnection();
