
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Brain, RefreshCw, Zap, CheckCircle2 } from "lucide-react"
import { CLINICAL_PROTOCOLS } from "@/lib/data/clinical-protocols"
import { toast } from "sonner"
import { useState } from "react"

export function ClinicalIntelligenceSettings() {
    const [isUpdating, setIsUpdating] = useState(false)
    const [useAI, setUseAI] = useState(true)
    const [aiPersonality, setAiPersonality] = useState("Atue como um Fisioterapeuta Sênior especialista em Prática Baseada em Evidências. Seja direto, técnico e empático.")

    const handleUpdateCheck = () => {
        setIsUpdating(true)
        // Mock API call
        setTimeout(() => {
            setIsUpdating(false)
            toast.success("Protocolos atualizados com sucesso!", {
                description: "Sua base de conhecimento está sincronicada com as diretrizes de 2025."
            })
        }, 2000)
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Protocolos Ativos</CardTitle>
                        <Brain className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{CLINICAL_PROTOCOLS.length}</div>
                        <p className="text-xs text-muted-foreground">Baseados em evidência</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Última Atualização</CardTitle>
                        <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Hoje</div>
                        <p className="text-xs text-muted-foreground">Sincronização automática</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Status da IA</CardTitle>
                        <Zap className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Online</div>
                        <p className="text-xs text-muted-foreground">Assistente pronto</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Comportamento da IA</CardTitle>
                        <CardDescription>Configure como o assistente deve responder e gerar relatórios.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="ai-active">Ativar Sugestões Automáticas</Label>
                            <Switch id="ai-active" checked={useAI} onCheckedChange={setUseAI} />
                        </div>
                        <div className="space-y-2">
                            <Label>Personalidade / Contexto</Label>
                            <Textarea
                                className="min-h-[100px]"
                                value={aiPersonality}
                                onChange={(e) => setAiPersonality(e.target.value)}
                                placeholder="Defina como a IA deve se comportar..."
                            />
                            <p className="text-xs text-muted-foreground">
                                Estas instruções são enviadas junto com cada solicitação para guiar o estilo da resposta.
                            </p>
                        </div>
                        <Button onClick={() => toast.success("Configurações salvas!")}>Salvar Preferências</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Base de Conhecimento</CardTitle>
                        <CardDescription>Protocolos clínicos carregados no sistema.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Patologia</TableHead>
                                        <TableHead>Região</TableHead>
                                        <TableHead className="text-right">Ação</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {CLINICAL_PROTOCOLS.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-medium">
                                                {p.patologia}
                                                <div className="text-[10px] text-muted-foreground capitalize">
                                                    {p.fontes_evidencia[0]}
                                                </div>
                                            </TableCell>
                                            <TableCell>{p.regiao}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="outline" className="text-green-600 bg-green-50">
                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                    Ativo
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="mt-4">
                            <Button variant="outline" className="w-full" disabled={isUpdating} onClick={handleUpdateCheck}>
                                {isUpdating ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        Verificando atualizações...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Verificar Atualizações de Protocolos
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
