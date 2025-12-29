import { Pool } from 'pg'

// Use connection string from env, adjusting for transaction mode if needed
// Fallback to local 54322 if not set (matching our scripts)
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

// Singleton Pool
const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
        ? false
        : { rejectUnauthorized: false },
    max: 10,           // limited pool
    idleTimeoutMillis: 30000
})

export const db = {
    query: (text: string, params?: any[]) => pool.query(text, params),
}
