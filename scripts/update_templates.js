
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const orgId = '9571532e-fdf8-4aaa-b236-416fd6459566';

const updates = [
    { trigger: 'appointment_confirmation_immediate', content: 'Olá {{paciente}}! Boas notícias: seu agendamento na *Access Fisioterapia* foi realizado com sucesso. ✅\n\nEstamos ansiosos para te receber!\n\n*Detalhes:*\n📅 Data: *{{data}}* às *{{horario}}*\n👤 Profissional: *{{profissional}}*\n📍 Local: {{endereco}}\n🗺️ Link do Mapa: {{local_url}}\n\nQualquer dúvida ou necessidade de remarcação, é só nos chamar por aqui. Até logo! 👋' },
    { trigger: 'appointment_confirmation', content: 'Olá {{paciente}}, seu atendimento na Access Fisioterapia está chegando! ✨\nGostaríamos de confirmar sua presença para amanhã ({{data}}) às {{horario}} com {{profissional}}.\n\n📍 {{endereco}}\n\n*Por favor, confirme clicando no link:*\n{{confirmacao_link}}\n\n{{links_questionarios}}' },
    { trigger: 'post_attendance', content: 'Olá {{paciente}}, como você se sentiu após o atendimento hoje com o(a) {{profissional}}? 😊\n\nSua opinião é fundamental para mantermos a excelência do nosso cuidado. Se puder, deixe uma breve avaliação no Google: {{link_avaliacao}}\n\nConte sempre conosco para o que precisar!' }
];

async function run() {
    for (const up of updates) {
        const { error } = await supabase.from('message_templates').update({ content: up.content }).eq('organization_id', orgId).eq('trigger_type', up.trigger);
        if (error) console.error('Error updating ' + up.trigger, error);
        else console.log('Updated ' + up.trigger);
    }

    // Add Birthday if not exists
    const { data: bday } = await supabase.from('message_templates').select('id').eq('organization_id', orgId).eq('trigger_type', 'birthday').maybeSingle();
    if (!bday) {
        await supabase.from('message_templates').insert({
            organization_id: orgId,
            title: 'Lembrete de Aniversário',
            trigger_type: 'birthday',
            channel: 'whatsapp',
            content: 'Olá {{paciente}}, hoje o dia é todo seu! 🥳\nA equipe da Access Fisioterapia passa para te desejar um Feliz Aniversário! Que seu novo ciclo seja repleto de saúde, leveza e muitas conquistas.\n\nÉ um honra ter você conosco. Aproveite muito o seu dia! 🎂✨',
            is_active: true
        });
        console.log('Added Birthday template');
    }
    console.log('Done!');
}
run();
