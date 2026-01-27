import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function migrate() {
    console.log('🚀 Iniciando migração para repetição de mensagens...')

    // 1. Adicionar colunas de repetição
    const { error: err1 } = await supabase.rpc('execute_sql', {
        sql_query: `
            ALTER TABLE message_templates 
            ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS retry_interval_hours INTEGER DEFAULT 24;
        `
    })

    if (err1) {
        console.error('❌ Erro ao adicionar colunas de repetição:', err1)
    } else {
        console.log('✅ Colunas de repetição adicionadas.')
    }

    console.log('🏁 Migração finalizada.')
}

migrate()
