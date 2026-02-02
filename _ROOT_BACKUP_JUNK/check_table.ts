import { createClient } from '@supabase/supabase-js';

const currentDB = createClient(
    'https://robptuukezhqvtasjyhz.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYnB0dXVrZXpocXZ0YXNqeWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ4NjcwMCwiZXhwIjoyMDgzMDYyNzAwfQ.hufdKEjY0XFSIYvrv7FrNyb2aX49JORBulplO19d0u4'
);

async function check() {
    const { data, error } = await currentDB.from('price_table_items').select('*').limit(1);
    console.log('price_table_items:', { data, error });
    
    const { data: d2, error: e2 } = await currentDB.from('price_tables').select('*').limit(1);
    console.log('price_tables:', { data: d2, error: e2 });
}
check();
