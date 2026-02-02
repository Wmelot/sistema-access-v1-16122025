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

// [AUTO-FIX] Supabase Pooler Port 6543 requires username as 'postgres.[PROJECT_REF]'
// If we are hitting 6543 and the user is just 'postgres', we fix it dynamically.
if (connectionString.includes(':6543') && connectionString.includes('pooler.supabase.com')) {
    const url = new URL(connectionString);
    if (url.username === 'postgres') {
        // Extract project ref from hostname (usually 'aws-0-ref.pooler.supabase.com' or similar)
        // Or better: extract it from the SUPABASE_URL if available
        const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1].split('.')[0];
        if (projectRef) {
            url.username = `postgres.${projectRef}`;
            connectionString = url.toString();
        }
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
