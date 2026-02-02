import { Pool } from 'pg'

// DYNAMIC DNS FIX (Applied everywhere to prevent ENOTFOUND on Vercel)
// This must run before any network connection
process.env.TZ = 'America/Sao_Paulo'
const dns = require('dns')
if (dns && typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first')
}

// [FIX] Force DIRECT_URL (port 5432) to avoid "Tenant or user not found" from Supabase Pooler.
let connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || '';

// [SUPER-FIX] Ensures the username has the project prefix if using the Pooler (port 6543)
// ID do projeto: robptuukezhqvtasjyhz
if (connectionString.includes(':6543')) {
    const projectRef = 'robptuukezhqvtasjyhz';
    if (connectionString.includes('pooler.supabase.com') && !connectionString.includes(`postgres.${projectRef}`)) {
        connectionString = connectionString.replace('postgres:', `postgres.${projectRef}:`);
    }
}

if (connectionString.includes('localhost')) {
    connectionString = connectionString.replace('localhost', '127.0.0.1')
}

// Singleton pattern to prevent multiple pools in Next.js Development (Hot Reload)
let pool: Pool

if (process.env.NODE_ENV === 'production') {
    pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        max: 20, // Higher limit for production
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000, // Increased to 10s for reliability
    })
} else {
    // In development, use specific global var to preserve pool across reloads
    if (!(global as any).postgresPool) {
        (global as any).postgresPool = new Pool({
            connectionString,
            ssl: (connectionString.includes('127.0.0.1') || connectionString.includes('localhost'))
                ? false
                : { rejectUnauthorized: false },
            max: 15, // Increased from 5 to 15 to handle concurreny
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 20000, // Increased to 20s to avoid premature timeouts
        })
    }
    pool = (global as any).postgresPool
}

export const db = {
    query: (text: string, params?: any[]) => pool.query(text, params),
}
