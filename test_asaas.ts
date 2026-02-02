
import { createAdminClient } from './src/lib/supabase/admin'
import { getOrCreateAsaasCustomer } from './src/lib/asaas'
import * as dotenv from 'dotenv'

// Manual env load because relative imports might fail in npx context
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYnB0dXVrZXpocXZ0YXNqeWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ4NjcwMCwiZXhwIjoyMDgzMDYyNzAwfQ.hufdKEjY0XFSIYvrv7FrNyb2aX49JORBulplO19d0u4"
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://robptuukezhqvtasjyhz.supabase.co"
process.env.ASAAS_API_KEY = "$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmJmN2NkMTg0LTc2MGYtNDRhOS04MGZiLTAxYjRlMGM2OGUyMjo6JGFhY2hfYjI0ZTM2YWUtMzFmNi00MDYwLWE2NzItNTdhNGYxNGYxZTc3"

async function test() {
    const id = 'd0744c7a-df6f-49ca-9e96-4f0b49fb0388' // Jade
    try {
        console.log('Testing getOrCreateAsaasCustomer for Jade...');
        const cid = await getOrCreateAsaasCustomer(id);
        console.log('Success! Customer ID:', cid);
    } catch (e: any) {
        console.error('FAILED:', e.message);
    }
}

test();
