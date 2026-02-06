const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://robptuukezhqvtasjyhz.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYnB0dXVrZXpocXZ0YXNqeWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ4NjcwMCwiZXhwIjoyMDgzMDYyNzAwfQ.hufdKEjY0XFSIYvrv7FrNyb2aX49JORBulplO19d0u4');

const WARLEY_ID = '839a77d3-a7f0-4103-bc4a-004ec550bd15';

async function run() {
    console.log('Iniciando migração DEFINITIVA com mapeamento de colunas correto...');

    const { data: oldEvs, error: fetchErr } = await s.from('academic_evidences').select('*');
    if (fetchErr) {
        console.error('Erro ao buscar dados antigos:', fetchErr);
        return;
    }

    console.log(`Encontrados ${oldEvs.length} registros para processar.`);

    for (const ev of oldEvs) {
        const { data: reg, error: regErr } = await s.from('acad_registros').insert({
            organization_id: ev.organization_id,
            user_id: ev.professor_id || WARLEY_ID,
            professor_id: ev.professor_id,
            title: ev.title,
            category: (ev.category || 'ENSINO').toUpperCase(),
            description: ev.description,
            impact: ev.impact_results,
            status: 'finalized',
            created_at: ev.created_at,
            metadata: {
                integration_axes: ev.integration_axes || [],
                integration_description: ev.integration_description || ''
            }
        }).select('id').single();

        if (regErr) {
            console.error(`Erro ao inserir novo registro "${ev.title}":`, regErr);
            continue;
        }

        if (reg && ev.image_url) {
            await s.from('acad_midias').insert({
                registro_id: reg.id,
                url: ev.image_url,
                media_type: 'image'
            });
        }

        console.log(`Migrado com sucesso: "${ev.title}". Apagando original...`);
        await s.from('academic_evidences').delete().eq('id', ev.id);
    }

    console.log('Migração concluída!');
}

run();
