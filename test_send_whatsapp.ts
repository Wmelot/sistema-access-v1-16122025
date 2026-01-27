import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { createAdminClient } from "./src/lib/supabase/server"

async function testSendWhatsApp() {
    const supabase = await createAdminClient()
    const organizationId = '9571532e-fdf8-4aaa-b236-416fd6459566'

    console.log('\n🧪 TESTE DE ENVIO - WhatsApp\n')
    console.log('='.repeat(60))

    // 1. Buscar configurações
    const { data: zapi } = await supabase
        .from('api_integrations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('provider', 'zapi')
        .single()

    const { data: testMode } = await supabase
        .from('api_integrations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('provider', 'test_mode')
        .single()

    if (!zapi) {
        console.error('❌ Configuração Z-API não encontrada')
        return
    }

    console.log('📱 Configurações:')
    console.log('   Z-API:', zapi.is_active ? '🟢 Ativo' : '🔴 Inativo')
    console.log('   Modo Teste:', testMode?.config?.isActive ? '🟢 ATIVO' : '🔴 Desativado')
    console.log('')

    // Determinar número de destino
    let destinationNumber = '5531991856084' // Seu número
    let message = '🧪 TESTE - Axiom WhatsApp\n\nSe você recebeu esta mensagem, o sistema está funcionando perfeitamente! ✅'

    if (testMode?.config?.isActive) {
        destinationNumber = testMode.config.safeNumber.replace(/\D/g, '')
        if (!destinationNumber.startsWith('55')) {
            destinationNumber = '55' + destinationNumber
        }
        message = `[MODO TESTE] Para: ${destinationNumber}\n\n` + message
        console.log('⚠️  Modo Teste ATIVO')
        console.log(`   Todas as mensagens vão para: ${destinationNumber}`)
    } else {
        console.log('✅ Modo Teste DESATIVO')
        console.log(`   Enviando para número real: ${destinationNumber}`)
    }

    console.log('')
    console.log('📤 Enviando mensagem...')
    console.log('   Para:', destinationNumber)
    console.log('   Mensagem:', message.substring(0, 50) + '...')
    console.log('')

    try {
        const { instanceId, token, clientToken } = zapi.config
        const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(clientToken ? { 'Client-Token': clientToken } : {})
            },
            body: JSON.stringify({
                phone: destinationNumber,
                message: message
            })
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('❌ ERRO ao enviar:')
            console.error('   Status HTTP:', response.status)
            console.error('   Resposta:', JSON.stringify(data, null, 2))

            if (data.message?.includes('not a valid number')) {
                console.error('')
                console.error('⚠️  PROBLEMA: Número inválido')
                console.error(`   O número ${destinationNumber} não é válido para Z-API`)
                console.error('   Verifique se o número tem WhatsApp ativo')
            }
        } else {
            console.log('✅ MENSAGEM ENVIADA COM SUCESSO!')
            console.log('   Message ID:', data.id || data.messageId)
            console.log('   Resposta completa:', JSON.stringify(data, null, 2))
            console.log('')
            console.log('📲 Verifique seu WhatsApp agora!')
        }
    } catch (error: any) {
        console.error('❌ ERRO CRÍTICO:', error.message)
    }
}

testSendWhatsApp()
