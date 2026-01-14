import { Pool } from 'pg'

// Determine if we are in development mode
const isDev = process.env.NODE_ENV === 'development'

// Get connection string
let connectionString = process.env.DATABASE_URL || ''

// FORCE IPv4 FOR LOCALHOST (Fixes Dev Timeout)
// We do NOT touch DNS settings, just replace the host string if it's local.
if (isDev) {
    if (!connectionString || connectionString.includes('localhost')) {
        connectionString = connectionString
            ? connectionString.replace('localhost', '127.0.0.1')
            : 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
    }
}

// Pool Config
const poolConfig: any = {
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: isDev ? 5000 : 15000,
}

// SSL Logic
if (isDev && connectionString.includes('127.0.0.1')) {
    // Local Dev: No SSL
    poolConfig.ssl = false
} else {
    // Production (Vercel/Supabase): SSL Required
    // We treat any non-127.0.0.1 address as remote
    poolConfig.ssl = { rejectUnauthorized: false }
}

const pool = new Pool(poolConfig)

export const db = {
    query: (text: string, params?: any[]) => pool.query(text, params),
}
