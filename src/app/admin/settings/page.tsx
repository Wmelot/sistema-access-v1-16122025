import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollText, Cpu, CreditCard, Settings, Package, Users, Check, X } from "lucide-react";

import { TestAIButton } from "@/components/admin/TestAIButton";
import { getPlans } from "../plans/actions";
import { PlanEditor } from "../plans/plan-editor";
import { PlansManager } from "./components/plans-manager";

import { SettingsTabs } from "./components/settings-tabs";

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
    const { plans } = await getPlans() as { plans: any[] };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Configurações Master</h1>
                <p className="text-zinc-500">Painel de controle central da plataforma Axiom.</p>
            </div>

            <SettingsTabs>
                {{
                    general: (
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Identidade Visual Padrão</CardTitle>
                                    <CardDescription>Defina as cores e logo padrão para novas clínicas.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label>Nome da Plataforma (Whitelabel)</Label>
                                        <Input defaultValue="Axiom" readOnly />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Domínio Base</Label>
                                        <Input defaultValue="access.axiom.com.br" disabled />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Segurança Global</CardTitle>
                                    <CardDescription>Políticas de acesso e senhas.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="outline" className="text-red-600 border-red-200 bg-red-50 hover:bg-red-100 w-full sm:w-auto">
                                        Forçar Reset de Senha (Global)
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    ),
                    plans: <PlansManager initialPlans={plans} />,
                    ai: (
                        <Card>
                            <CardHeader>
                                <CardTitle>Configuração Google Gemini</CardTitle>
                                <CardDescription>Gerencie a inteligência artificial do sistema.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>API Key (Google AI Studio)</Label>
                                    <Input type="password" value="**************************" disabled />
                                    <p className="text-xs text-zinc-500">Definido em .env.local (GEMINI_API_KEY)</p>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Prompt do System (Evolução Clínica)</Label>
                                    <div className="p-3 bg-zinc-50 border rounded-md text-sm text-zinc-600 font-mono overflow-x-auto whitespace-pre-wrap">
                                        "ATUE COMO UM FISIOTERAPEUTA SÊNIOR..." (Definido em código: gemini.ts)
                                    </div>
                                </div>

                                <hr className="my-2 border-zinc-100" />

                                <div className="grid gap-2">
                                    <Label>Diagnóstico de Conexão</Label>
                                    <TestAIButton />
                                </div>
                            </CardContent>
                        </Card>
                    ),
                    logs: (
                        <div className="space-y-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                                    <div className="space-y-1">
                                        <CardTitle>Logs de Auditoria</CardTitle>
                                        <CardDescription>Acompanhe todas as ações realizadas no sistema para conformidade LGPD.</CardDescription>
                                    </div>
                                    <ScrollText className="h-5 w-5 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-zinc-600 mb-6">
                                        Clique no botão abaixo para abrir o painel completo de auditoria.
                                        Você pode filtrar por data, exportar relatórios e visualizar detalhes de cada operação.
                                    </p>
                                    <Button
                                        onClick={() => {
                                            // Trigger log viewer via a custom event or shared state if possible, 
                                            // but layout-client handles it. Since we are in the same client-side context (mostly),
                                            // we can use a custom event.
                                            window.dispatchEvent(new CustomEvent('open-lgpd-logs'))
                                        }}
                                        className="w-full sm:w-auto gap-2"
                                    >
                                        <ScrollText className="h-4 w-4" />
                                        Visualizar Registro de Atividades
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    )
                }}
            </SettingsTabs>
        </div>
    );
}

function FeatureCheck({ label, active }: { label: string, active: boolean }) {
    return (
        <div className="flex items-center gap-2 text-xs">
            {active ? (
                <Check className="w-3 h-3 text-green-500" />
            ) : (
                <X className="w-3 h-3 text-zinc-300" />
            )}
            <span className={active ? 'text-zinc-700' : 'text-zinc-400'}>{label}</span>
        </div>
    );
}
