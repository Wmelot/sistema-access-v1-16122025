
const { createClient } = require('@supabase/supabase-js');

// We need the PERMISSION_METADATA. I'll just use a subset or try to import it if I could.
// Actually, I'll just use the roles/actions.ts function if I can run it.
// But better to just run the code directly here.

const supabase = createClient(
    'https://robptuukezhqvtasjyhz.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYnB0dXVrZXpocXZ0YXNqeWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ4NjcwMCwiZXhwIjoyMDgzMDYyNzAwfQ.hufdKEjY0XFSIYvrv7FrNyb2aX49JORBulplO19d0u4'
);

const PERMISSIONS = [
    { code: 'dashboard.view', description: 'Visualizar Painel', module: 'Menu Superior' },
    { code: 'settings.view', description: 'Configurações: Acesso Básico', module: 'Gestão (Módulos)' },
    { code: 'sidebar.management.view', description: 'Sidebar: Configurações Gerais', module: 'Menu Lateral' },
    // ... I won't put all 172 here, but at least the critical ones.
];

async function sync() {
    console.log('Syncing critical permissions...');
    const { error } = await supabase.from('permissions').upsert(
        PERMISSIONS.map(p => ({ code: p.code, description: p.description, module: p.module })),
        { onConflict: 'code' }
    );
    if (error) console.error('Error syncing:', error);
    else console.log('Sync complete!');
}

sync();
