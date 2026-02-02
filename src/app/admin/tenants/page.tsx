import { createAdminClient } from "@/lib/supabase/admin";
import { TenantsList } from "./components/tenants-list";

export const dynamic = "force-dynamic";

export default async function TenantsPage() {
    const supabase = createAdminClient();

    // Fetch Organizations (Bypass RLS to see all tenants)
    const { data: organizations, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

    return (
        <TenantsList organizations={organizations || []} />
    );
}
