const { createClient } = require('@supabase/supabase-js');

const supabase = createClient("https://robptuukezhqvtasjyhz.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYnB0dXVrZXpocXZ0YXNqeWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ4NjcwMCwiZXhwIjoyMDgzMDYyNzAwfQ.hufdKEjY0XFSIYvrv7FrNyb2aX49JORBulplO19d0u4");

async function check() {
    const { data: profile } = await supabase.from('profiles').select('role_id, full_name').ilike('full_name', '%Giordano%').single();
    console.log('User:', profile.full_name, 'Role ID:', profile.role_id);

    const { data: perms } = await supabase.from('role_permissions').select('permissions!inner(code, description)').eq('role_id', profile.role_id);
    console.log('Sidebar Perms for this role:');
    console.log(perms.map(p => p.permissions.code).filter(c => c.startsWith('sidebar.')));
}
check();
