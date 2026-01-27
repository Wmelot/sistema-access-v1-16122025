import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function fixSchema() {
    if (!supabaseUrl || !supabaseKey) {
        console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Checking message_templates table...");

    // Add questionnaire_type column using manual query if possible, or RPC
    // Since I can't run raw SQL easily without RPC, I'll try to use the 'query' rpc if exists
    // Most Axiom projects have a 'execute_sql' or 'db_query' rpc.

    const { error: error1 } = await supabase.rpc('execute_sql', {
        sql_query: `
            ALTER TABLE message_templates 
            ADD COLUMN IF NOT EXISTS questionnaire_type TEXT DEFAULT 'none';
        `
    });

    if (error1) {
        console.error("Error adding questionnaire_type:", error1);
    } else {
        console.log("Successfully added questionnaire_type column.");
    }
}

fixSchema();
