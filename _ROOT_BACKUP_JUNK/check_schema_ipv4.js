
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dns = require('dns').promises;

async function run() {
    // Read .env.local
    const envPath = path.join(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const dbUrlLine = envContent.split('\n').find(line => line.startsWith('DATABASE_URL='));

    if (!dbUrlLine) {
        console.error('DATABASE_URL not found');
        process.exit(1);
    }

    let rawUrl = dbUrlLine.split('=')[1].trim().replace(/^["']|["']$/g, '');

    // Parse URL with handling for @ in password
    // Format: postgresql://user:pass@host:port/db
    // We look for the LAST @ to separate auth from host
    const lastAt = rawUrl.lastIndexOf('@');
    if (lastAt !== -1) {
        const hostPart = rawUrl.substring(lastAt + 1);
        const match = hostPart.match(/^([^:]+):(\d+)/);

        if (match) {
            const host = match[1];

            console.log(`Resolving IP for ${host}...`);
            try {
                const addresses = await dns.resolve4(host);
                if (addresses && addresses.length > 0) {
                    const ip = addresses[0];
                    console.log(`Resolved to IPv4: ${ip}`);
                    // Replace ONLY the host part in the URL string
                    rawUrl = rawUrl.substring(0, lastAt + 1) + rawUrl.substring(lastAt + 1).replace(host, ip);
                }
            } catch (e) {
                console.warn('DNS Resolution failed, trying original host:', e.message);
            }
        }
    }

    console.log('Connecting to DB...');
    // Log the masked URL for debugging 
    // (masking password requires careful regex not to mask the host if password has @)
    console.log('Target URL starts with:', rawUrl.substring(0, 25) + '...');

    const pool = new Pool({
        connectionString: rawUrl,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000
    });

    try {
        const res = await pool.query(`SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'`);
        console.log('CONNECTION SUCCESSFUL!');
        console.log('Total Tables in Public Schema:', res.rows[0].count);

        const forms = await pool.query(`
            SELECT count(*) FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'form_templates'
        `);
        console.log('Form Templates Table Exists:', forms.rows[0].count > 0);

    } catch (e) {
        console.error('Connection Failed:', e.message);
        if (e.message.includes('auth')) console.error('Possible Password/User Error');
    } finally {
        await pool.end();
    }
}

run();
