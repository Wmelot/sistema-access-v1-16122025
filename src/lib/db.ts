import { Pool } from 'pg'

/**
 * [FIX DEFINITIVO] MOTOR DE CONEXÃO AO BANCO
 * Baseado na solução estável de Janeiro.
 * Prioriza a conexão direta (5432) mas corrige o Tenant na porta 6543.
 */

const getConnectionString = () => {
    // 1. Prioridade máxima: Variáveis do ambiente (Vercel/Local)
    let url = process.env.DIRECT_URL || process.env.DATABASE_URL || '';

    // 2. Fallback Hardcoded (Dados reais do seu .env.local)
    if (!url) {
        url = 'postgresql://postgres.robptuukezhqvtasjyhz:0xw8SnQc09fHn7S4@aws-0-sa-east-1.pooler.supabase.com:6543/postgres';
    }

    // 3. [O PULO DO GATO] Fix de Tenant para Port 6543
    // Se estivermos na porta 6543, o usuário PRECISA do prefixo do projeto.
    if (url.includes(':6543')) {
        const projectRef = 'robptuukezhqvtasjyhz';
        // Procura por //postgres: e troca por //postgres.[REF]:
        if (url.includes('//postgres:') && !url.includes(`postgres.${projectRef}`)) {
            url = url.replace('//postgres:', `//postgres.${projectRef}:`);
        }
    }

    // 4. Fix para Localhost
    if (url.includes('localhost')) {
        url = url.replace('localhost', '127.0.0.1');
    }

    return url;
}

const connectionString = getConnectionString();

// Criamos o Pool de conexões
const pool = new Pool({
    connectionString,
    ssl: (connectionString.includes('127.0.0.1')) ? false : { rejectUnauthorized: false },
    max: 20, // Aumentado para o faturamento em massa
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
});

export const db = {
    /**
     * Executa uma query SQL direta no banco.
     * Útil para ignorar RLS e problemas de cache do Supabase Client.
     */
    query: async (text: string, params?: any[]) => {
        try {
            return await pool.query(text, params);
        } catch (err: any) {
            console.error('[DATABASE_ERROR]:', err.message);
            // Se o erro ainda for Tenant, vamos logar a URL (mascarada) para depurar
            if (err.message.includes('Tenant')) {
                const maskedUrl = connectionString.replace(/:[^@]*@/, ':****@');
                console.error('[TENANT_DEBUG] Tentamos conectar com:', maskedUrl);
            }
            throw err;
        }
    },
}
