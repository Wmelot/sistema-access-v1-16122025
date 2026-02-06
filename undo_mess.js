const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://robptuukezhqvtasjyhz.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYnB0dXVrZXpocXZ0YXNqeWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ4NjcwMCwiZXhwIjoyMDgzMDYyNzAwfQ.hufdKEjY0XFSIYvrv7FrNyb2aX49JORBulplO19d0u4');

async function run() {
    console.log('Unificando tudo na tabela ORIGINAL (academic_evidences)...');

    // 1. Pegar dados das tabelas "novas" que eu criei por erro
    const { data: newRegs } = await s.from('acad_registros').select('*, acad_midias(*)');

    if (newRegs && newRegs.length > 0) {
        for (const reg of newRegs) {
            // Verificar se já existe na antiga para não duplicar
            const { data: existing } = await s.from('academic_evidences')
                .select('id')
                .eq('title', reg.title)
                .eq('organization_id', reg.organization_id)
                .maybeSingle();

            if (!existing) {
                console.log(`Voltando registro para a tabela certa: ${reg.title}`);
                await s.from('academic_evidences').insert({
                    organization_id: reg.organization_id,
                    professor_id: reg.professor_id,
                    title: reg.title,
                    category: reg.category,
                    description: reg.description,
                    impact_results: reg.impact,
                    image_url: reg.acad_midias?.[0]?.url || '',
                    integration_axes: reg.integration || [],
                    created_at: reg.created_at
                });
            }
        }
    }

    console.log('Dados unificados. Agora o sistema usará apenas academic_evidences.');
}

run();
