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

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
    const { plans } = await getPlans() as { plans: any[] };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Configurações Master</h1>
                <p className="text-zinc-500">Painel de controle central da plataforma Axiom.</p>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
                    <TabsTrigger value="general" className="gap-2"><Settings className="w-4 h-4" /> Geral</TabsTrigger>
                    <TabsTrigger value="plans" className="gap-2"><CreditCard className="w-4 h-4" /> Planos</TabsTrigger>
                    <TabsTrigger value="ai" className="gap-2"><Cpu className="w-4 h-4" /> IA (Gemini)</TabsTrigger>
                    <TabsTrigger value="logs" className="gap-2"><ScrollText className="w-4 h-4" /> Logs</TabsTrigger>
                </TabsList>

                {/* --- GERAL --- */}
                <TabsContent value="general" className="space-y-4 mt-6">
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
                            <Button variant="outline" className="text-red-600 border-red-200 bg-red-50 hover:bg-red-100">Forçar Reset de Senha (Global)</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- PLANOS --- */}
                <TabsContent value="plans" className="space-y-6 mt-6">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold tracking-tight">Planos & Preços (SaaS)</h2>
                            <p className="text-muted-foreground">Gerencie as ofertas e limites do sistema.</p>
                        </div>
                        <PlanEditor mode="create" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plans?.map((plan: any) => (
                            <Card key={plan.id} className={`flex flex-col relative overflow-hidden ${!plan.is_active ? 'opacity-60 bg-zinc-50' : ''}`}>
                                {!plan.is_active && (
                                    <div className="absolute top-0 right-0 bg-zinc-500 text-white text-[10px] px-2 py-0.5 font-bold">INATIVO</div>
                                )}
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                                            <CardDescription className="font-mono text-xs uppercase tracking-widest mt-1">{plan.slug}</CardDescription>
                                        </div>
                                        <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                                            {plan.is_active ? 'Ativo' : 'Rascunho'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-4">
                                    <div className="grid grid-cols-2 gap-2 py-2 border-y border-zinc-100">
                                        <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                                            <Users className="w-3.5 h-3.5" />
                                            <span>{plan.max_professionals} Profs.</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                                            <Package className="w-3.5 h-3.5" />
                                            <span>{plan.max_patients === 999999 ? 'Ilimitado' : `${plan.max_patients} Pac.`}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 mt-2">
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter mb-2">Recursos Ativos</p>
                                        <FeatureCheck label="Agenda" active={!!plan.features.agenda_module} />
                                        <FeatureCheck label="Financeiro" active={!!plan.features.financial_module} />
                                        <FeatureCheck label="IA Assistant" active={!!plan.features.ai_assistant} />
                                        <FeatureCheck label="WhatsApp" active={!!plan.features.whatsapp_integration} />
                                        <FeatureCheck label="Teleconsulta" active={!!plan.features.teleconsultation} />
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-4 border-t bg-zinc-50/50 mt-auto">
                                    <PlanEditor mode="edit" plan={plan} />
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* --- IA (GEMINI) --- */}
                <TabsContent value="ai" className="space-y-4 mt-6">
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
                                <Label>Prompt do Sistema (Evolução Clínica)</Label>
                                <div className="p-3 bg-zinc-50 border rounded-md text-sm text-zinc-600 font-mono">
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
                </TabsContent>

                {/* --- LOGS --- */}
                <TabsContent value="logs" className="space-y-4 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Logs do Sistema</CardTitle>
                            <CardDescription>Registro de atividades importantes.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border bg-zinc-950 text-zinc-50 p-4 font-mono text-xs overflow-auto h-[300px]">
                                <p><span className="text-zinc-500">[21:30:05]</span> <span className="text-green-400">INFO</span> User wmelot@gmail.com promoted to MASTER.</p>
                                <p><span className="text-zinc-500">[21:28:12]</span> <span className="text-yellow-400">WARN</span> Missing column 'status' in organizations table.</p>
                                <p><span className="text-zinc-500">[21:28:12]</span> <span className="text-green-400">INFO</span> Fixed schema on DB 54322.</p>
                                <p><span className="text-zinc-500">[21:25:00]</span> <span className="text-red-400">ERROR</span> Code duplicated in signUp page. Fixed.</p>
                                <p><span className="text-zinc-500">[21:10:00]</span> <span className="text-green-400">INFO</span> Gemini AI Integrated correctly.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
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
