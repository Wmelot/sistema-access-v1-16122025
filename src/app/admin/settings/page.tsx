"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollText, Cpu, CreditCard, Settings } from "lucide-react";

import { TestAIButton } from "@/components/admin/TestAIButton";

export default function AdminSettingsPage() {
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
                                <Input defaultValue="Axiom" />
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
                <TabsContent value="plans" className="space-y-4 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Planos & Preços (SaaS)</CardTitle>
                            <CardDescription>Configure os planos disponíveis para assinatura.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg p-4 mb-4 flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold">Basic (R$ 97/mês)</h4>
                                    <p className="text-sm text-zinc-500">1 Usuário, 500 Pacientes</p>
                                </div>
                                <Badge variant="secondary">Ativo</Badge>
                            </div>
                            <div className="border rounded-lg p-4 mb-4 flex items-center justify-between bg-zinc-50 opacity-60">
                                <div>
                                    <h4 className="font-bold">Pro (R$ 197/mês)</h4>
                                    <p className="text-sm text-zinc-500">3 Usuários, Ilimitado</p>
                                </div>
                                <Badge variant="outline">Em Breve</Badge>
                            </div>
                            <Button>Adicionar Novo Plano</Button>
                        </CardContent>
                    </Card>
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
