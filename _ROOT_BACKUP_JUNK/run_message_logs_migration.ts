import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { createAdminClient } from "./src/lib/supabase/server"

async function runMigration() {
    const supabase = await createAdminClient()

    console.log('\n🔧 Executando Migration: Add organization_id to message_logs\n')
    console.log('='.repeat(60))

    try {
        // Check if column exists
        const { data: columns, error: checkError } = await supabase
            .rpc('exec', {
                query: `
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'message_logs' 
                    AND column_name = 'organization_id'
                `
            })

        if (checkError) {
            // Fallback: Try to add column directly
            console.log('⚠️  Não conseguiu verificar coluna, tentando adicionar diretamente...')
        }

        // Add column (will fail silently if exists)
        const { error: alterError } = await supabase.rpc('exec', {
            query: `
                ALTER TABLE message_logs 
                ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
                
                CREATE INDEX IF NOT EXISTS idx_message_logs_organization_id 
                ON message_logs(organization_id);
            `
        })

        if (alterError) {
            console.error('❌ Erro ao executar migration:', alterError)
            console.log('\n⚠️  ALTERNATIVA: Execute este SQL manualmente no Supabase SQL Editor:')
            console.log('\nALTER TABLE message_logs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;')
            console.log('CREATE INDEX IF NOT EXISTS idx_message_logs_organization_id ON message_logs(organization_id);')
        } else {
            console.log('✅ Migration executada com sucesso!')
            console.log('   Coluna organization_id adicionada à tabela message_logs')
        }

    } catch (error: any) {
        console.error('❌ ERRO:', error.message)
        console.log('\n📝 SOLUÇÃO MANUAL:')
        console.log('1. Acesse: https://supabase.com/dashboard/project/robptuukezhqvtasjyhz/sql/new')
        console.log('2. Cole e execute:')
        console.log('\nALTER TABLE message_logs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;')
        console.log('CREATE INDEX IF NOT EXISTS idx_message_logs_organization_id ON message_logs(organization_id);')
    }
}

runMigration()
