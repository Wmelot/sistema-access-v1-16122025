import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { createAdminClient } from "./src/lib/supabase/server"

async function debugAppointment() {
    const supabase = await createAdminClient()

    // Pegar o ID completo mais recente
    console.log('\n🔍 DIAGNÓSTICO: Appointment Confirmation\n')
    console.log('='.repeat(60))

    // 1. Buscar últimos agendamentos criados
    console.log('📋 Últimos 3 agendamentos criados:\n')
    const { data: recent, error: recentError } = await supabase
        .from('appointments')
        .select('id, created_at, patient_id, start_time, status')
        .order('created_at', { ascending: false })
        .limit(3)

    if (recentError) {
        console.error('❌ Erro ao buscar agendamentos:', recentError)
        return
    }

    if (!recent || recent.length === 0) {
        console.log('⚠️  Nenhum agendamento encontrado')
        return
    }

    recent.forEach((appt, idx) => {
        console.log(`${idx + 1}. ID: ${appt.id}`)
        console.log(`   Criado em: ${appt.created_at}`)
        console.log(`   Início: ${appt.start_time}`)
        console.log(`   Status: ${appt.status}`)
        console.log('')
    })

    // 2. Testar busca EXATAMENTE como a API pública faz
    const testId = recent[0].id
    console.log(`🧪 Testando busca pública para ID: ${testId}`)
    console.log('   (Simulando exatamente o que /api/public/appointment/[id] faz)\n')

    const { data: appt, error: apptError } = await supabase
        .from('appointments')
        .select(`
            *,
            patient:patient_id (name, phone),
            professional:professional_id (full_name, photo_url),
            location:location_id (name),
            organization:organization_id (slug, name)
        `)
        .eq('id', testId)
        .maybeSingle()

    if (apptError) {
        console.error('❌ ERRO na busca:', apptError)
        console.error('   Código:', apptError.code)
        console.error('   Mensagem:', apptError.message)
        console.error('   Detalhe:', apptError.details)

        if (apptError.message.includes('foreign key')) {
            console.error('\n⚠️  PROBLEMA DETECTADO: Sintaxe de relacionamento incorreta')
            console.error('   A sintaxe patient:patient_id pode estar errada no Vercel')
        }
        return
    }

    if (!appt) {
        console.log('❌ AGENDAMENTO NÃO ENCONTRADO (retornou null)')
        console.log('   Isso não deveria acontecer, pois o ID existe!')

        // Tentar busca sem relacionamentos
        console.log('\n🔍 Testando busca SEM relacionamentos...')
        const { data: simple, error: simpleError } = await supabase
            .from('appointments')
            .select('*')
            .eq('id', testId)
            .single()

        if (simpleError) {
            console.error('❌ Erro mesmo sem relacionamentos:', simpleError)
        } else if (simple) {
            console.log('✅ Busca simples FUNCIONOU!')
            console.log('   Problema está nos RELACIONAMENTOS')
            console.log('\n   IDs encontrados:')
            console.log('   - patient_id:', simple.patient_id)
            console.log('   - professional_id:', simple.professional_id)
            console.log('   - location_id:', simple.location_id)
            console.log('   - organization_id:', simple.organization_id)
        }

        return
    }

    console.log('✅ AGENDAMENTO ENCONTRADO COM SUCESSO!')
    console.log('\nDados retornados:')
    console.log(JSON.stringify(appt, null, 2))

    console.log('\n📌 LINK DE TESTE:')
    console.log(`   https://axiom-production.vercel.app/confirmar/${testId}`)
}

debugAppointment()
