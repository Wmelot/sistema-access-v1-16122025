import { getClinicSettings } from './actions';
import { SettingsView } from './settings-view';
import { hasPermission } from '@/lib/rbac';
import { getRoles, getAllPermissions } from './roles/actions';
import { getIntegrations } from './system/apis/actions';
import { getReportTemplates } from './reports/actions';
import { createClient } from '@/lib/supabase/server';
import { isMasterUser } from '@/lib/auth-master';

import { ManagementHeader } from "@/components/dashboard/management-header";

export default async function SettingsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    // 1. Fetch Basic Settings (Always visible)
    const settings = await getClinicSettings(slug);
    const hasGoogleIntegration = !!process.env.GOOGLE_CLIENT_ID;

    // ... existing fetches ...
    const reportTemplates = await getReportTemplates() || [];
    const canManageRoles = true;
    let roles: any[] = [];
    let allPermissions: any[] = [];

    if (canManageRoles) {
        roles = await getRoles() || [];
        allPermissions = await getAllPermissions() || [];
    }

    const canManageApis = await hasPermission('system.manage_apis');
    let integrations: any[] = [];

    if (canManageApis) {
        integrations = await getIntegrations() || [];
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const isMaster = await isMasterUser(user?.id);

    if (!settings) {
        return (
            <div className="container mx-auto py-10 text-center">
                <h2 className="text-xl font-semibold">Configurações não encontradas</h2>
                <p className="text-muted-foreground">Não foi possível carregar os dados desta clínica.</p>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-6 max-w-6xl">
            <ManagementHeader
                slug={slug}
                title="Configurações do Sistema"
                description="Central de controle da sua clínica."
            />

            <SettingsView
                initialSettings={settings}
                hasGoogleIntegration={hasGoogleIntegration}
                rolesData={{
                    canManage: canManageRoles,
                    roles,
                    permissions: allPermissions
                }}
                apiData={{
                    canManage: canManageApis,
                    integrations
                }}
                reportTemplates={reportTemplates}
                auditData={{}}
                isMaster={isMaster}
                slug={slug}
            />

        </div>
    );
}
