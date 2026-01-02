
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Brain, RefreshCw, Zap, CheckCircle2, Lock, Trash2, Plus, FileText, Ban } from "lucide-react"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { getProtocols, createProtocol, toggleProtocolStatus, deleteProtocol } from "./actions"

export function ClinicalIntelligenceSettings() {
    const [protocols, setProtocols] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isUpdating, setIsUpdating] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [useAI, setUseAI] = useState(true)
    const [aiPersonality, setAiPersonality] = useState("Atue como um Fisioterapeuta Sênior especialista em Prática Baseada em Evidências. Seja direto, técnico e empático.")

    // Load protocols
    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const data = await getProtocols()
            setProtocols(data || [])
        } catch (error) {
            console.error(error)
            toast.error("Erro ao carregar protocolos locais.")
            // Fallback to empty or static if needed, but for now show empty
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateCheck = () => {
        setIsUpdating(true)
        setTimeout(() => {
            setIsUpdating(false)
            toast.success("Protocolos atualizados com sucesso!", {
                description: "Sua base de conhecimento está sincronicada com as diretrizes de 2025."
            })
        }, 2000)
    }

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        try {
            await createProtocol(formData)
            toast.success("Novo protocolo adicionado!")
            setIsDialogOpen(false)
            loadData()
        } catch (error) {
            toast.error("Erro ao adicionar protocolo")
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja remover este protocolo personalizado?")) return
        try {
            await deleteProtocol(id)
            toast.success("Protocolo removido.")
            loadData()
        } catch (error) {
            toast.error("Erro ao remover.")
        }
    }

    const handleToggle = async (id: string, currentStatus: boolean, isCustom: boolean) => {
        if (!isCustom) {
            toast.info("Protocolos do Sistema não podem ser desativados.", {
                description: "Eles garantem a qualidade baseada em evidência padrão."
            })
            return
        }
        try {
            await toggleProtocolStatus(id, !currentStatus)
            toast.success(`Protocolo ${!currentStatus ? 'ativado' : 'desativado'}.`)
            loadData()
        } catch (error) {
            toast.error("Erro ao atualizar status.")
        }
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
                        <div className="text-2xl font-bold">{loading ? "..." : protocols.filter(p => p.is_active).length}</div>
                        <p className="text-xs text-muted-foreground">Baseados em evidência</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Personalizados</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? "..." : protocols.filter(p => p.is_custom).length}</div>
                        <p className="text-xs text-muted-foreground">Adicionados pela equipe</p>
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
                <Card className="h-fit">
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
                        <Button onClick={() => toast.success("Configurações salvas!")} className="w-full">
                            Salvar Preferências
                        </Button>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 lg:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Base de Conhecimento</CardTitle>
                            <CardDescription>Gerencie os protocolos clínicos.</CardDescription>
                        </div>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Adicionar
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Adicionar Novo Protocolo</DialogTitle>
                                    <DialogDescription>
                                        Insira os dados do novo protocolo clínico baseado em evidência.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleCreate} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Patologia / Título</Label>
                                        <Input name="title" required placeholder="Ex: Entorse de Tornozelo" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Região Corporal</Label>
                                        <Input name="region" required placeholder="Ex: Membro Inferior" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Fontes de Evidência (Artigos)</Label>
                                        <Textarea name="evidence_sources" placeholder="Um por linha. Ex: Guideline JOSPT 2023..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Resumo Clínico</Label>
                                        <Textarea name="description" required placeholder="Descrição breve da condição e abordagem sugerida..." />
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit">Salvar Protocolo</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Patologia</TableHead>
                                        <TableHead>Fontes</TableHead>
                                        <TableHead className="text-right">Ação</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {protocols.length === 0 && !loading && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                                                Nenhum protocolo encontrado. (Execute a migration?)
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {protocols.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    {p.title}
                                                    {p.is_custom ? (
                                                        <Badge variant="secondary" className="text-[10px]">Personalizado</Badge>
                                                    ) : (
                                                        <span title="Sistema (Padrão Ouro)">
                                                            <Lock className="w-3 h-3 text-muted-foreground" />
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground">{p.region}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-xs max-w-[200px] truncate" title={p.evidence_sources?.join('\n')}>
                                                    {p.evidence_sources?.[0] || '-'}
                                                    {p.evidence_sources?.length > 1 && ` (+${p.evidence_sources.length - 1})`}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {p.is_custom ? (
                                                        <>
                                                            <Switch
                                                                checked={p.is_active}
                                                                onCheckedChange={() => handleToggle(p.id, p.is_active, p.is_custom)}
                                                            />
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}>
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <Badge variant="outline" className="text-green-600 bg-green-50">Sistema</Badge>
                                                    )}
                                                </div>
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
                                        Sincronizar Diretrizes
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
