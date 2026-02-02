import { Pool } from 'pg'

// DYNAMIC DNS FIX
process.env.TZ = 'America/Sao_Paulo'
const dns = require('dns')
if (dns && typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first')
}

/**
 * [SUPER-FIX] CONFIGURAÇÃO DE CONEXÃO DIRETA
 * Ignora as variáveis de ambiente instáveis do Vercel e força o caminho direto.
 */
const PROJECT_REF = 'robptuukezhqvtasjyhz';
const DB_PASS = '0xw8SnQc09fHn7S4';

// Em produção, forçamos a porta 5432 (Conexão Direta) que é imune ao erro de Tenant
const prodConnectionString = `postgresql://postgres:${DB_PASS}@db.${PROJECT_REF}.supabase.co:5432/postgres`;
const localConnectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || '';

const connectionString = process.env.NODE_ENV === 'production'
    ? prodConnectionString
    : localConnectionString;

let pool: Pool;

if (process.env.NODE_ENV === 'production') {
    pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    });
    console.log('[DB] Conexão Direta (Prod) Iniciada.');
} else {
    if (!(global as any).postgresPool) {
        (global as any).postgresPool = new Pool({
            connectionString: connectionString.includes('localhost') ? connectionString.replace('localhost', '127.0.0.1') : connectionString,
            ssl: (connectionString.includes('127.0.0.1')) ? false : { rejectUnauthorized: false },
            max: 10,
        });
    }
    pool = (global as any).postgresPool;
}

export const db = {
    query: async (text: string, params?: any[]) => {
        try {
            return await pool.query(text, params);
        } catch (err: any) {
            console.error('[DB ERROR] Query failed:', err.message);
            throw err;
        }
    },
}
