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
import { GlobalResetPasswordButton } from "./components/global-reset-password-button";

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
    const { plans } = await getPlans() as { plans: any[] };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-zinc-900">Configurações Master</h1>
                <p className="text-sm text-zinc-500 font-medium">Painel de controle central da plataforma Axiom.</p>
            </div>

            <SettingsTabs>
                {{
                    general: (
                        <div className="space-y-4">
                            <Card className="border-zinc-200">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold">Identidade Visual Padrão</CardTitle>
                                    <CardDescription className="text-xs text-zinc-500">Defina as cores e logo padrão para novas clínicas.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label className="text-xs">Nome da Plataforma (Whitelabel)</Label>
                                        <Input defaultValue="Axiom" readOnly className="bg-zinc-50 border-zinc-200" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-xs">Domínio Base</Label>
                                        <Input defaultValue="access.axiom.com.br" disabled className="bg-zinc-50 border-zinc-200" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-zinc-200">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold">Segurança Global</CardTitle>
                                    <CardDescription className="text-xs text-zinc-500">Políticas de acesso, senhas e auditoria central.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <GlobalResetPasswordButton />
                                </CardContent>
                            </Card>
                        </div>
                    ),
                    plans: <PlansManager initialPlans={plans} />,
                    ai: (
                        <Card className="border-zinc-200">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold">Configuração Google Gemini</CardTitle>
                                <CardDescription className="text-xs text-zinc-500">Gerencie o motor de inteligência artificial clínica.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label className="text-xs">Chave de API (Google AI Studio)</Label>
                                    <Input type="password" value="**************************" disabled className="bg-zinc-50 border-zinc-200" />
                                    <p className="text-[10px] text-zinc-400 italic">Definido em variável de ambiente (GEMINI_API_KEY)</p>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold">Arquitetura de Prompt (Evolução Clínica)</Label>
                                    <div className="p-3 bg-zinc-900 border rounded-md text-[11px] text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                        "ATUE COMO UM FISIOTERAPEUTA SÊNIOR..." (Otimizado via gemini.ts)
                                    </div>
                                </div>

                                <hr className="my-2 border-zinc-100" />

                                <div className="grid gap-2">
                                    <Label className="text-xs">Diagnóstico em Tempo Real</Label>
                                    <TestAIButton />
                                </div>
                            </CardContent>
                        </Card>
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
