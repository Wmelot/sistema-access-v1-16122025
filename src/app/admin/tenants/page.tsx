import { createAdminClient } from "@/lib/supabase/admin";
import { TenantsList } from "./components/tenants-list";

export const dynamic = "force-dynamic";

export default async function TenantsPage() {
    const supabase = createAdminClient();

    // Fetch Organizations + Profile Counts + Responsible Email
    // We can't do complex joins with count easily in one select for large lists in Supabase without RPC or multiple queries.
    // For now, let's fetch all orgs and then the counts.

    const { data: organizations } = await supabase
        .from('organizations')
        .select('*, plan_configs(name)')
        .order('created_at', { ascending: false });

    // Fetch ALL Profiles in these orgs to resolve emails correctly
    const orgIds = organizations?.map(o => o.id) || []
    const { data: allRelatedProfiles } = await supabase
        .from('profiles')
        .select('id, organization_id, email, role')
        .in('organization_id', orgIds)

    const profileCounts: Record<string, number> = {}
    const orgAdmins: Record<string, string> = {}
    const profileMap: Record<string, any> = {}

    allRelatedProfiles?.forEach(p => {
        if (p.organization_id) {
            profileCounts[p.organization_id] = (profileCounts[p.organization_id] || 0) + 1
            // Save potential admin email as fallback
            if (p.role === 'admin' || p.role === 'Admin' || p.role === 'Owner') {
                orgAdmins[p.organization_id] = p.email
            }
        }
        profileMap[p.id] = p
    })

    const organizationsWithMeta = (organizations || []).map(org => {
        // Priority 1: Explicit owner_id
        let email = 'Não def.'
        const explicitOwner = profileMap[org.owner_id || '']
        if (explicitOwner) {
            email = explicitOwner.email
        } else {
            // Priority 2: Any admin in the org
            email = orgAdmins[org.id] || email
        }

        return {
            ...org,
            plan: (org.plan_configs as any)?.name || org.plan,
            professional_count: profileCounts[org.id] || 0,
            responsible_email: email
        }
    })

    return (
        <TenantsList organizations={organizationsWithMeta} />
    );
}
