import { Client } from 'pg';

async function run() {
    const client = new Client({
        connectionString: "postgresql://postgres:0xw8SnQc09fHn7S4@db.robptuukezhqvtasjyhz.supabase.co:5432/postgres"
    });

    try {
        await client.connect();
        await client.query('ALTER TABLE plan_configs ADD COLUMN IF NOT EXISTS max_patients integer DEFAULT 100');
        await client.query('ALTER TABLE plan_configs ADD COLUMN IF NOT EXISTS price_yearly numeric DEFAULT 0');
        
        console.log('Success adding columns.');

        const plans = [
            { name: 'Free', slug: 'free', price: 0, max_pros: 1, max_pats: 50 },
            { name: 'Profissional', slug: 'professional', price: 97, max_pros: 3, max_pats: 500 },
            { name: 'Premium', slug: 'premium', price: 197, max_pros: 10, max_pats: 2000 },
            { name: 'Enterprise', slug: 'enterprise', price: 497, max_pros: 999, max_pats: 999999 }
        ];

        for (const p of plans) {
            console.log(`Upserting plan: ${p.name}`);
            const query = `
                INSERT INTO plan_configs (name, slug, price_monthly, max_professionals, max_patients, features)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (slug) DO UPDATE 
                SET name = EXCLUDED.name, 
                    price_monthly = EXCLUDED.price_monthly,
                    max_professionals = EXCLUDED.max_professionals,
                    max_patients = EXCLUDED.max_patients
            `;
            const features = {
                agenda_module: true,
                records_module: true,
                financial_module: p.slug !== 'free',
                marketing_module: p.slug !== 'free',
                ai_assistant: p.slug === 'premium' || p.slug === 'enterprise',
                whatsapp_integration: p.slug === 'premium' || p.slug === 'enterprise',
                zapi_messaging: p.slug === 'enterprise',
                protocol_management: true,
                form_management: true
            };
            await client.query(query, [p.name, p.slug, p.price, p.max_pros, p.max_pats, JSON.stringify(features)]);
        }
        console.log('Plans seeded successfully.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}
run();
