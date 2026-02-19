import { ArrowLeft, Building2, CreditCard, ShieldAlert, Activity, Users, Calendar, Crown, CheckCircle2, History, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantDetails, toggleTenantStatus } from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DangerZoneActions } from "./components/danger-zone-actions";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { TenantResponsibleManager } from "./components/tenant-responsible-manager";
import { TenantFeaturesManager } from "./components/tenant-features-manager";
import { TenantPlanManager } from "./components/tenant-plan-manager";
import { TenantGranularAccessManager } from "./components/tenant-granular-access-manager";
import { getAvailablePlans, getTenantFormAccess, getTenantProtocolAccess, getTenantZapiConfig, getGlobalMessageTemplates } from "./actions";
import { TenantZapiConfig } from "./components/tenant-zapi-config";

export default async function TenantDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [data, availablePlans, formAccess, protocolAccess, zapiConfig, globalTemplates] = await Promise.all([
        getTenantDetails(id),
        getAvailablePlans(),
        getTenantFormAccess(id),
        getTenantProtocolAccess(id),
        getTenantZapiConfig(id),
        getGlobalMessageTemplates()
    ]) as [any, any[], any, any, any, any[]];

    if (data.error) {
        // If specific error, throw it so Error Boundary catches it instead of 404
        throw new Error(data.error);
    }

    const { org, metrics, profiles } = data;
    const planName = org.plan_config?.name || 'Personalizado/Legado';
    const isActive = org.status === 'active' || (org.active === true && org.status !== 'suspended');

    const maxPros = org.plan_config?.max_professionals || 1;
    const usedPros = metrics.professionals || 0;
    const usagePercent = Math.min((usedPros / maxPros) * 100, 100);

    return (
        <div className="min-h-screen bg-zinc-50/50">
            {/* Ambient Background */}
            <div className="absolute inset-0 -z-10 h-[500px] w-full bg-gradient-to-b from-indigo-50/50 via-white to-transparent" />

            <div className="space-y-8 container mx-auto py-10 max-w-6xl">
                {/* Header / Nav */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/tenants">
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white shadow-sm hover:bg-zinc-100 border border-zinc-200">
                                <ArrowLeft className="h-5 w-5 text-zinc-600" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold tracking-tight text-zinc-900">{org.name}</h1>
                                <Badge variant={isActive ? "default" : "destructive"} className="h-6 px-3">
                                    {isActive ? "Ativo" : "Suspenso"}
                                </Badge>
                                {planName === 'Enterprise' && (
                                    <Badge variant="outline" className="h-6 px-3 border-amber-200 bg-amber-50 text-amber-700">
                                        <Crown className="w-3 h-3 mr-1 fill-amber-400 text-amber-600" />
                                        Prime
                                    </Badge>
                                )}
                            </div>
                            <p className="text-zinc-500 text-sm mt-1 flex items-center gap-2">
                                ID do Cliente: <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600 font-mono text-xs">{org.id}</code>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href={`/dashboard/${org.slug}`} target="_blank">
                            <Button variant="outline" className="bg-white">
                                <Activity className="w-4 h-4 mr-2 text-indigo-500" />
                                Visualizar Dashboard
                            </Button>
                        </Link>
                        <form action={async () => {
                            'use server';
                            await toggleTenantStatus(id, isActive);
                        }}>
                            <Button
                                variant={isActive ? "outline" : "default"}
                                type="submit"
                                className={isActive ? "border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" : "bg-green-600 hover:bg-green-700"}
                            >
                                {isActive ? (
                                    <>
                                        <ShieldAlert className="w-4 h-4 mr-2" />
                                        Suspender Acesso
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Reativar Acesso
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column: Metrics & Features (8 cols) */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card className="border-indigo-100 bg-indigo-50/30">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-indigo-900 flex items-center gap-2">
                                        <Users className="h-4 w-4 text-indigo-500" />
                                        Pacientes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-indigo-700">{metrics.patients}</div>
                                    <p className="text-xs text-indigo-600/60 mt-1">Total na base</p>
                                </CardContent>
                            </Card>
                            <Card className="border-emerald-100 bg-emerald-50/30">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-emerald-900 flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-emerald-500" />
                                        Agendamentos
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-emerald-700">{metrics.appointments}</div>
                                    <p className="text-xs text-emerald-600/60 mt-1">Histórico completo</p>
                                </CardContent>
                            </Card>
                            <Card className="border-zinc-200 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-zinc-600 flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-zinc-400" />
                                        Atividade
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-zinc-900">--%</div>
                                    <p className="text-xs text-zinc-500 mt-1">Engajamento semanal</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Plan & Features */}
                        <TenantFeaturesManager
                            tenantId={org.id}
                            initialFeatures={org.features}
                            planName={planName}
                        />

                        {/* Z-API Technical Config */}
                        <TenantZapiConfig
                            tenantId={org.id}
                            initialConfig={zapiConfig}
                        />

                        {/* Granular Content Management */}
                        <TenantGranularAccessManager
                            tenantId={id}
                            forms={formAccess}
                            protocols={protocolAccess}
                            messageTemplates={{
                                all: globalTemplates,
                                allowedIds: org.features?.allowed_message_templates || []
                            }}
                        />
                    </div>

                    {/* Right Column: Limits & Financial (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Limits Card (Interactive) */}
                        <TenantResponsibleManager
                            tenantId={id}
                            maxPros={maxPros}
                            usedPros={usedPros}
                            usagePercent={usagePercent}
                            owner={data.owner}
                            profiles={profiles}
                        />
                        {/* Financial Card */}
                        <TenantPlanManager
                            tenantId={id}
                            currentPlanId={org.plan_config_id}
                            availablePlans={availablePlans}
                        />

                        {/* Danger Zone */}
                        <Card className="border-red-200 shadow-none">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-2">
                                    <ShieldAlert className="h-3.5 w-3.5" />
                                    Zona de Perigo
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-[10px] text-zinc-500 leading-tight">
                                    Ações irreversíveis que afetam a integridade dos dados desta organização.
                                </p>
                                <DangerZoneActions orgId={org.id} orgName={org.name} />
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </div>
        </div>
    );
}
