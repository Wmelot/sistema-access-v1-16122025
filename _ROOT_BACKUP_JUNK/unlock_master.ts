import { createClient } from "@supabase/supabase-js";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function unlockMasterFeatures() {
    const MASTER_ORG_ID = '00000000-0000-0000-0000-000000000001';

    // Define FULL features for Master
    const masterFeatures = {
        marketing_module: true,
        advanced_reports: true,
        whatsapp_integration: true,
        ai_assistant: true,
        custom_forms: true,
        api_access: true,
        white_label: true
    };

    console.log(`Unlocking features for Master Org: ${MASTER_ORG_ID}...`);

    const { data, error } = await supabase
        .from('organizations')
        .update({ features: masterFeatures })
        .eq('id', MASTER_ORG_ID)
        .select()
        .single();

    if (error) {
        console.error("Error updating Master Org features:", error);
    } else {
        console.log("Success! Master features updated:", data.features);
    }
}

unlockMasterFeatures();
