import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

async function seedTemplates() {
    const envPath = path.resolve(process.cwd(), '.env.local')
    const envContent = fs.readFileSync(envPath, 'utf8')
    const env: Record<string, string> = {}
    envContent.split('\n').forEach(line => {
        let [key, ...valueParts] = line.split('=')
        if (key && valueParts.length > 0) {
            let val = valueParts.join('=').trim()
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.substring(1, val.length - 1)
            }
            env[key.trim()] = val
        }
    })

    const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
    const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY']
    const supabase = createClient(supabaseUrl!, supabaseKey!)

    // Pegar o ID da organização do slug atual (assumindo o slug da foto, 'access-fisioterapia')
    const slug = 'access-fisioterapia'
    const { data: org } = await supabase.from('organizations').select('id').eq('slug', slug).single()

    if (!org) {
        console.error("Org not found for slug:", slug)
        return
    }

    const organizationId = org.id

    const defaults = [
        {
            title: 'Boas-vindas (Imediato ao Agendar)',
            trigger_type: 'appointment_confirmation_immediate',
            content: 'Olá {{paciente}}, seu agendamento foi realizado com sucesso para o dia {{data}} às {{horario}} com {{profissional}}. Guarde esta mensagem!',
            is_active: true
        },
        {
            title: 'Confirmação (24h antes)',
            trigger_type: 'appointment_confirmation',
            content: 'Olá {{paciente}}, seu agendamento está confirmado para amanhã ({{data}}) às {{horario}} com {{profissional}}. Por favor, confirme sua presença clicando no link: {{confirmacao_link}}',
            is_active: true
        },
        {
            title: 'Reforço Confirmação (8h antes)',
            trigger_type: 'appointment_confirmation_8h',
            content: 'Olá {{paciente}}, ainda não recebemos sua confirmação para o atendimento hoje às {{horario}}. Poderia confirmar sua presença? Link: {{confirmacao_link}}',
            is_active: true
        },
        {
            title: 'Último Chamado (2h antes)',
            trigger_type: 'appointment_confirmation_2h',
            content: 'Olá {{paciente}}, sua consulta é em 2 horas! Ainda dá tempo de confirmar sua presença: {{confirmacao_link}}',
            is_active: true
        },
        {
            title: 'Lembrete (Agendamento Confirmado)',
            trigger_type: 'appointment_reminder_confirmed_2h',
            content: 'Olá {{paciente}}, falta pouco para sua consulta hoje às {{horario}}! Já está tudo pronto para te receber.',
            is_active: true
        },
        {
            title: 'Envio de Questionários (12h antes)',
            trigger_type: 'questionnaire_12h',
            content: 'Olá {{paciente}}, para agilizar seu atendimento, por favor preencha os formulários abaixo antes da sua consulta com {{profissional}}:{{links_questionarios}}',
            is_active: true
        },
        {
            title: 'Pós-Atendimento / Feedback',
            trigger_type: 'post_attendance',
            content: 'Olá {{paciente}}, como foi seu atendimento hoje com {{profissional}}? Sua opinião é muito importante para nós!',
            is_active: true
        }
    ]

    console.log("Seeding templates for Org ID:", organizationId)

    for (const def of defaults) {
        const { data: existing } = await supabase
            .from('message_templates')
            .select('id')
            .eq('organization_id', organizationId)
            .eq('trigger_type', def.trigger_type)
            .maybeSingle()

        if (!existing) {
            const { error: insErr } = await supabase.from('message_templates').insert({
                ...def,
                organization_id: organizationId,
                channel: 'whatsapp'
            })
            if (insErr) console.error("Error inserting", def.title, insErr)
            else console.log("Created:", def.title)
        } else {
            console.log("Exists:", def.title)
        }
    }
}

seedTemplates()
