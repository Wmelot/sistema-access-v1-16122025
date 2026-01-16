import { Pool } from 'pg'

// DYNAMIC DNS FIX for Local Development (Remote Supabase)
// We use require() inside the check to avoid top-level import issues in Edge/Vercel
if (process.env.NODE_ENV === 'development') {
    try {
        const dns = require('dns')
        if (dns && typeof dns.setDefaultResultOrder === 'function') {
            dns.setDefaultResultOrder('ipv4first')
            console.log('[DB] Applied IPv4 First DNS strategy for Development')
        }
    } catch (e) {
        // Ignore if dns module is missing or fails
        console.warn('[DB] Failed to set DNS order:', e)
    }
}

let connectionString = process.env.DATABASE_URL || ''

// Safety: Attempt to swap localhost for IP if strictly local-looking format (extra safety)
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
        connectionTimeoutMillis: 5000,
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
