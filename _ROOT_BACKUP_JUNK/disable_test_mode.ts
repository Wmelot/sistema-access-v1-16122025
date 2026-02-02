import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { createAdminClient } from "./src/lib/supabase/server"

async function disableTestMode() {
    const supabase = await createAdminClient()
    const organizationId = '9571532e-fdf8-4aaa-b236-416fd6459566'

    const { data, error } = await supabase
        .from('api_integrations')
        .update({
            config: {
                isActive: false,
                safeNumber: "31991856084"
            }
        })
        .eq('organization_id', organizationId)
        .eq('provider', 'test_mode')
        .select()

    if (error) {
        console.error('❌ Error:', error)
    } else {
        console.log('✅ Modo de Teste DESATIVADO com sucesso!')
        console.log('📱 WhatsApp agora enviará mensagens para os números REAIS dos pacientes.')
        console.log('Resultado:', JSON.stringify(data, null, 2))
    }
}

disableTestMode()
