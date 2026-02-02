import { Pool } from 'pg'

/**
 * [LIB DB - LEGACY SUPPORT]
 * Este arquivo agora é mantido apenas para compatibilidade.
 * Recomendação: Usar o cliente do Supabase (REST) para evitar erros de Tenant.
 */

const getConnectionString = () => {
    let url = process.env.DATABASE_URL || process.env.DIRECT_URL || '';

    if (url.includes('localhost')) {
        return url.replace('localhost', '127.0.0.1');
    }

    // Surgical fix: se estiver no Pooler e sem prefixo, adiciona o prefixo robptuukezhqvtasjyhz
    if (url.includes(':6543') && url.includes('postgres:') && !url.includes('robptuukezhqvtasjyhz')) {
        url = url.replace('postgres:', 'postgres.robptuukezhqvtasjyhz:');
    }

    return url;
}

const pool = new Pool({
    connectionString: getConnectionString(),
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

export const db = {
    query: (text: string, params?: any[]) => pool.query(text, params),
}
