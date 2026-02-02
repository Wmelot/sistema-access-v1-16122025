import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { createAdminClient } from "./src/lib/supabase/server"

async function diagnoseWhatsApp() {
    const supabase = await createAdminClient()
    const organizationId = '9571532e-fdf8-4aaa-b236-416fd6459566'

    console.log('\n🔍 DIAGNÓSTICO COMPLETO - WhatsApp Z-API\n')
    console.log('='.repeat(60))

    // 1. Buscar configuração
    const { data: zapi, error: zapiError } = await supabase
        .from('api_integrations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('provider', 'zapi')
        .single()

    if (zapiError || !zapi) {
        console.error('❌ Configuração Z-API não encontrada:', zapiError)
        return
    }

    console.log('✅ Configuração Z-API encontrada:')
    console.log('   Instance ID:', zapi.config.instanceId)
    console.log('   Token:', zapi.config.token.substring(0, 10) + '...')
    console.log('   Client-Token:', zapi.config.clientToken ? zapi.config.clientToken.substring(0, 10) + '...' : 'Não configurado')
    console.log('   Status:', zapi.is_active ? '🟢 Ativo' : '🔴 Inativo')
    console.log('')

    // 2. Testar conexão com Z-API
    console.log('🔌 Testando conexão com Z-API...\n')

    const { instanceId, token, clientToken } = zapi.config
    const statusUrl = `https://api.z-api.io/instances/${instanceId}/token/${token}/status`

    try {
        const response = await fetch(statusUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(clientToken ? { 'Client-Token': clientToken } : {})
            }
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('❌ ERRO na conexão Z-API:')
            console.error('   Status HTTP:', response.status)
            console.error('   Resposta:', JSON.stringify(data, null, 2))
            console.error('')

            if (data.message?.includes('client-token')) {
                console.error('⚠️  PROBLEMA DETECTADO: Client-Token inválido ou obrigatório')
                console.error('   Solução: Entre em contato com suporte@z-api.io para:')
                console.error('   1. Desabilitar proteção Client-Token (mais fácil)')
                console.error('   2. OU gerar um novo Client-Token válido')
            }

            return
        }

        console.log('✅ Conexão com Z-API OK')
        console.log('   Status da Instância:', JSON.stringify(data, null, 2))
        console.log('')

        // 3. Verificar se está conectado
        if (data.connected === false || data.status === 'DISCONNECTED') {
            console.error('❌ WHATSAPP DESCONECTADO!')
            console.error('   A instância Z-API perdeu a conexão com o WhatsApp.')
            console.error('   Solução: Acesse o painel Z-API e leia o QR Code novamente.')
            console.error('   URL: https://painel.z-api.io/')
            return
        }

        console.log('✅ WhatsApp conectado e operacional!')
        console.log('')

        // 4. Buscar últimas mensagens enviadas (logs)
        console.log('📋 Últimas 5 tentativas de envio:\n')
        const { data: logs, error: logsError } = await supabase
            .from('message_logs')
            .select('*')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })
            .limit(5)

        if (logsError) {
            console.error('❌ Erro ao buscar logs:', logsError)
        } else if (!logs || logs.length === 0) {
            console.log('⚠️  Nenhum log de envio encontrado.')
        } else {
            logs.forEach((log, idx) => {
                console.log(`${idx + 1}. [${log.created_at}]`)
                console.log(`   Para: ${log.phone}`)
                console.log(`   Status: ${log.status === 'sent' ? '✅ Enviado' : '❌ Falhou'}`)
                if (log.error_message) {
                    console.log(`   Erro: ${log.error_message}`)
                }
                if (log.message_id) {
                    console.log(`   Message ID: ${log.message_id}`)
                }
                console.log('')
            })
        }

        // 5. Teste de envio REAL
        console.log('🧪 TESTE DE ENVIO OPCIONAL')
        console.log('   Execute: npx tsx test_send_whatsapp.ts')
        console.log('   (Vai enviar mensagem de teste para o número sandbox)')

    } catch (error: any) {
        console.error('❌ ERRO CRÍTICO ao conectar Z-API:')
        console.error('   ', error.message)
        console.error('')
        console.error('Possíveis causas:')
        console.error('   1. Instance ID ou Token incorretos')
        console.error('   2. Firewall bloqueando api.z-api.io')
        console.error('   3. Plano Z-API expirado/suspenso')
    }
}

diagnoseWhatsApp()
