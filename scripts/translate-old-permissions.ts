import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const client = createClient(supabaseUrl, supabaseServiceKey)

const translations: Record<string, string> = {
    'appointments.edit': 'Alterar Agendamentos',
    'appointments.view': 'Visualizar Agenda',
    'financial.view_clinic': 'Visualizar Financeiro da Clínica',
    'patients.edit': 'Alterar Pacientes',
    'patients.view': 'Visualizar Pacientes',
    'roles.manage': 'Gerenciar Perfis e Permissões',
    'settings.edit': 'Editar Configurações do Sistema',
    'system.access': 'Acesso Geral ao Sistema',
    'system.manage_apis': 'Gerenciar Chaves de API',
    'system.view_logs': 'Visualizar e Excluir Logs/Registros'
}

async function translate() {
    console.log("🔄 Translating old permissions to Portuguese...\n")

    for (const [code, description] of Object.entries(translations)) {
        const { error } = await client
            .from('permissions')
            .update({ description })
            .eq('code', code)

        if (error) {
            console.log(`❌ Error updating ${code}: ${error.message}`)
        } else {
            console.log(`✅ Updated ${code} → "${description}"`)
        }
    }

    console.log("\n✅ All permissions translated!")
}

translate()
