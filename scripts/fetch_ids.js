
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = "https://robptuukezhqvtasjyhz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYnB0dXVrZXpocXZ0YXNqeWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ4NjcwMCwiZXhwIjoyMDgzMDYyNzAwfQ.hufdKEjY0XFSIYvrv7FrNyb2aX49JORBulplO19d0u4";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    const { data: pros } = await supabase.from('profiles').select('id, name, email').limit(5);
    console.log("Profiles:", pros);
    const { data: patients } = await supabase.from('patients').select('id, name, email').limit(5);
    console.log("Patients:", patients);
}
check();
