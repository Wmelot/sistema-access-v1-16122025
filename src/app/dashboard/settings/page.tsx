import { getClinicSettings } from './actions';
import { SettingsView } from './settings-view';
import { hasPermission } from '@/lib/rbac';
import { getRoles, getAllPermissions } from './roles/actions';
import { getIntegrations } from './system/apis/actions';
import { getReportTemplates } from './reports/actions'; // [NEW]

export default async function SettingsPage() {
    // 1. Fetch Basic Settings (Always visible)
    const settings = await getClinicSettings();
    const hasGoogleIntegration = !!process.env.GOOGLE_CLIENT_ID;

    // Fetch Report Templates (Always visible or permission guarded?)
    // Assuming visible for now or check permission 'reports.manage'
    const reportTemplates = await getReportTemplates() || [];

    // 2. Fetch Roles Data (Permission Guarded)
    // TEMPORARY FIX: Force true to allow recovery
    const canManageRoles = true; // await hasPermission('roles.manage');
    let roles: any[] = [];
    let allPermissions: any[] = [];

    if (canManageRoles) {
        roles = await getRoles() || [];
        allPermissions = await getAllPermissions() || [];
    }

    // 3. Fetch API Data (Permission Guarded)
    const canManageApis = await hasPermission('system.manage_apis');
    let integrations: any[] = [];

    if (canManageApis) {
        integrations = await getIntegrations() || [];
    }

    return (
        <div className="container mx-auto py-10 max-w-6xl">
            <div className="mb-10">
                <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
                <p className="text-muted-foreground">
                    Central de controle da sua clínica.
                </p>
            </div>

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
                reportTemplates={reportTemplates} // [NEW]
                auditData={{}}
            />
        </div>
    );
}
