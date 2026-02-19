import { db } from './src/lib/db';

async function testConnection() {
    try {
        const res = await db.query('SELECT COUNT(*) FROM public.patients');
        console.log('Result:', res.rows[0]);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

testConnection();
