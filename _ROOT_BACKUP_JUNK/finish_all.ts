
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createAdminClient } from "./src/lib/supabase/server";

async function finishAll() {
    console.log("Finishing all in_progress appointments...");
    const supabase = await createAdminClient();

    // Find all in_progress
    const { data: active } = await supabase
        .from('appointments')
        .select('id')
        .eq('status', 'in_progress');

    if (!active || active.length === 0) {
        console.log("No active appointments found.");
        return;
    }

    console.log(`Found ${active.length} active appointments. Finishing...`);

    const { error } = await supabase
        .from('appointments')
        .update({ status: 'attended' })
        .eq('status', 'in_progress');

    if (error) {
        console.error("Error finishing appointments:", error);
    } else {
        console.log("All active appointments finished successfully.");
    }
}

finishAll();
