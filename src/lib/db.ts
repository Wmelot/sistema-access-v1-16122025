import { Pool } from 'pg'

// Use connection string from env, adjusting for transaction mode if needed
// Fallback to local 54322 if not set (matching our scripts)
// CRITICAL FIX: Force 127.0.0.1 if localhost is detected to avoid IPv6 timeouts
let connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

if (connectionString.includes('localhost')) {
    connectionString = connectionString.replace('localhost', '127.0.0.1')
}

// Singleton Pool
const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('127.0.0.1')
        ? false
        : { rejectUnauthorized: false },
    max: 10,           // limited pool
    idleTimeoutMillis: 30000
})

export const db = {
    query: (text: string, params?: any[]) => pool.query(text, params),
}
