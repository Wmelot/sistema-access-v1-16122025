import { Pool } from 'pg'

// DYNAMIC DNS FIX
process.env.TZ = 'America/Sao_Paulo'
const dns = require('dns')
if (dns && typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first')
}

/**
 * [SOLUÇÃO DEFINITIVA PARA TENANT]
 * Forçamos a URL do Pooler com o prefixo do projeto diretamente.
 * Isso impede que a Vercel tente conectar sem o ID do projeto.
 */
const PROJECT_REF = 'robptuukezhqvtasjyhz';
const DB_PASS = '0xw8SnQc09fHn7S4';

// URL Master que funciona com o Pooler do Supabase (Porta 6543)
// O segredo está no "postgres.ID_DO_PROJETO" no início da URL.
const MASTER_CONNECTION_URL = `postgresql://postgres.${PROJECT_REF}:${DB_PASS}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_timeout=15`;

const connectionString = process.env.NODE_ENV === 'production'
    ? MASTER_CONNECTION_URL
    : (process.env.DIRECT_URL || process.env.DATABASE_URL || MASTER_CONNECTION_URL);

let pool: Pool;

if (process.env.NODE_ENV === 'production') {
    pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        max: 20,
        idleTimeoutMillis: 30000,
    });
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
    query: (text: string, params?: any[]) => pool.query(text, params),
}
