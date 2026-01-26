import { createClient } from "@/lib/supabase/server";
import { TenantsList } from "./components/tenants-list";

export default async function TenantsPage() {
    const supabase = await createClient();

    // Fetch Organizations (RLS now allows Master to see all)
    const { data: organizations, error } = await supabase
        .from('organizations')
        .select('*')
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

    return (
        <TenantsList organizations={organizations || []} />
    );
}
