import { Pool } from 'pg'

// DYNAMIC DNS FIX
process.env.TZ = 'America/Sao_Paulo'
const dns = require('dns')
if (dns && typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first')
}

/**
 * CONFIGURAÇÃO DE BANCO DE DADOS RESILIENTE
 * Esta versão prioriza as variáveis de ambiente do sistema, mas corrige
 * automaticamente o erro de "Tenant or user not found" caso o Vercel mude as URLs.
 */
const PROJECT_REF = 'robptuukezhqvtasjyhz';

function getCleanConnectionString() {
    // Pegamos a URL que o sistema já tem
    let url = process.env.DIRECT_URL || process.env.DATABASE_URL || '';

    if (!url) {
        // Fallback total se as variáveis sumirem
        return `postgresql://postgres.${PROJECT_REF}:0xw8SnQc09fHn7S4@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`;
    }

    // Se estiver usando a porta do Pooler (6543), garantimos o prefixo do projeto no usuário
    if (url.includes(':6543') || url.includes('pooler.supabase.com')) {
        if (!url.includes(`postgres.${PROJECT_REF}`)) {
            url = url.replace('postgres:', `postgres.${PROJECT_REF}:`);
        }
    }

    // Força IPv4 no localhost
    if (url.includes('localhost')) {
        url = url.replace('localhost', '127.0.0.1');
    }

    return url;
}

const connectionString = getCleanConnectionString();

let pool: Pool;

if (process.env.NODE_ENV === 'production') {
    pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    });
} else {
    if (!(global as any).postgresPool) {
        (global as any).postgresPool = new Pool({
            connectionString,
            ssl: connectionString.includes('127.0.0.1') ? false : { rejectUnauthorized: false },
            max: 10,
        });
    }
    pool = (global as any).postgresPool;
}

export const db = {
    query: (text: string, params?: any[]) => pool.query(text, params),
}
