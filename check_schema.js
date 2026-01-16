
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dns = require('dns');

// Force IPv4
if (dns && typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
}

// Read .env.local manually
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlLine = envContent.split('\n').find(line => line.startsWith('DATABASE_URL='));

if (!dbUrlLine) {
    console.error('DATABASE_URL not found in .env.local');
    process.exit(1);
}

const rawUrl = dbUrlLine.split('=')[1].trim();
const connectionString = rawUrl.replace(/^["']|["']$/g, '');

console.log('Connecting to:', connectionString.replace(/:[^:@]*@/, ':****@'));

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });

async function checkSchema() {
    try {
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'organizations';
        `);
        console.log('Organizations table exists:', res.rows.length > 0);

        // Check if Form Templates table exists
        const forms = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'form_templates';
        `);
        console.log('Form Templates table exists:', forms.rows.length > 0);

        if (forms.rows.length > 0) {
            const count = await pool.query('SELECT COUNT(*) FROM form_templates');
            console.log('Form Templates count:', count.rows[0].count);
        }

    } catch (e) {
        console.error('Connection/Query Error:', e);
    } finally {
        pool.end();
    }
}

checkSchema();
