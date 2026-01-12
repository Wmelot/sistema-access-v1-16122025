import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function fixMasterPlan() {
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    await client.connect();

    try {
        // 1. Get Enterprise Plan ID
        const planRes = await client.query("SELECT id FROM plan_configs WHERE slug = 'enterprise' OR slug = 'prime' LIMIT 1");
        const enterprisePlan = planRes.rows[0];

        if (!enterprisePlan) {
            console.log("Enterprise plan not found. Creating it...");
            // Create if missing
            const newPlan = await client.query(`
                INSERT INTO plan_configs (name, slug, max_professionals, features, is_active)
                VALUES ('Enterprise', 'enterprise', 999, '{"everything": true}', true)
                RETURNING id;
            `);
            const newPlanId = newPlan.rows[0].id;

            console.log("Updating Master to new Enterprise Plan...");
            await client.query(`UPDATE organizations SET plan_config_id = '${newPlanId}' WHERE id = '00000000-0000-0000-0000-000000000001'`);
        } else {
            console.log("Updating Master to existing Enterprise Plan...", enterprisePlan.id);
            await client.query(`UPDATE organizations SET plan_config_id = '${enterprisePlan.id}' WHERE id = '00000000-0000-0000-0000-000000000001'`);
        }
        console.log("Master Organization updated.");

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

fixMasterPlan();
