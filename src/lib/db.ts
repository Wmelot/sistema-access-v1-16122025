import { Pool } from 'pg'
import dns from 'dns'

// HYBRID FIX:
// 1. In Development (Localhost): Force IPv4 to prevent ETIMEDOUT on Supabase (due to IPv6 issues).
// 2. In Production (Vercel): Do NOT force DNS order, as it causes ENOTFOUND.
if (process.env.NODE_ENV === 'development') {
    try {
        if (dns.setDefaultResultOrder) {
            dns.setDefaultResultOrder('ipv4first')
        }
    } catch (error) {
        console.warn('Failed to set DNS result order:', error)
    }
}

// Get Connection String
let connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

// Safety: Attempt to swap localhost for IP if strictly local-looking format (extra safety)
if (connectionString.includes('localhost')) {
    connectionString = connectionString.replace('localhost', '127.0.0.1')
}

// Singleton Pool
const pool = new Pool({
    connectionString,
    // SSL logic: Disable for local IP, enable for remote URLs (Supabase)
    ssl: (connectionString.includes('127.0.0.1') || connectionString.includes('localhost'))
        ? false
        : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000, // Slightly increased for bad networks
})

export const db = {
    query: (text: string, params?: any[]) => pool.query(text, params),
}
