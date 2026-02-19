
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://robptuukezhqvtasjyhz.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYnB0dXVrZXpocXZ0YXNqeWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ4NjcwMCwiZXhwIjoyMDgzMDYyNzAwfQ.hufdKEjY0XFSIYvrv7FrNyb2aX49JORBulplO19d0u4'
);

async function checkProfile() {
    console.log('Checking profile for wmelot@gmail.com...');
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
            *,
            roles(name),
            organizations(name, slug)
        `)
        .eq('email', 'wmelot@gmail.com');

    if (error) {
        console.error('Error fetching profile:', error);
        return;
    }

    console.log('Profile found:', JSON.stringify(profiles, null, 2));
}

checkProfile();
