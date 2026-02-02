import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupForms() {
    // List of forms to KEEP (based on user's confirmed "Foto 2")
    const keepTitles = [
        'Consulta Palmilha 2.0',
        'Avaliação Clínica Inteligente (PBE)',
        'Avaliação Clínica Inteligente',
        'Avaliação Física Avançada', // This title matches the card
        'Saúde da Mulher',
        'Palmilha pé insensível',
        'Palmilha biomecânica'
    ];

    console.log("Iniciando limpeza de templates...");

    // Get all templates
    const { data: templates } = await supabase.from('form_templates').select('id, title');

    if (!templates) return;

    const toDelete = templates.filter(t => !keepTitles.includes(t.title));

    console.log(`Encontrados ${toDelete.length} templates para remover.`);

    for (const t of toDelete) {
        console.log(`Removendo: ${t.title} (${t.id})`);
        const { error } = await supabase.from('form_templates').delete().eq('id', t.id);
        if (error) console.error(`Erro ao remover ${t.title}:`, error.message);
    }

    console.log("Limpeza concluída.");
}

cleanupForms();
