const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
    console.log('Deletando bloqueios de feriados antigos...');

    const { data, error } = await supabase
        .from('appointments')
        .delete()
        .like('notes', 'Feriado:%')
        .eq('type', 'block');

    if (error) {
        console.error('Erro:', error);
    } else {
        console.log('✅ Bloqueios deletados com sucesso!');
    }
})();
